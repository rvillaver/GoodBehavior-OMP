#!/usr/bin/env python3
"""GoodBehavior deterministic installer — the mechanical half of /adopt-goodbehavior.

The adopt skill does the JUDGMENT (elicit intent, resolve the profile, propose, get confirmation)
and then hands this script a plan; this script does the MECHANICS exactly the same way every time:
copy files, hash them, drop in the done-gate extension, write the manifest. Prompted models re-improvise procedures;
installs must not.

Usage:
    python3 scripts/install.py --plan plan.json          # execute
    python3 scripts/install.py --plan plan.json --dry-run

Plan format (written by the adopt skill after the user confirms):
{
  "source": "/abs/path/to/GoodBehavior",
  "target": "/abs/path/to/project",
  "skills":   ["audit-goodbehavior", "verify-goodbehavior", ...],   # skill DIR names to copy
  "profiles": ["analysis", "development"],   # ONLY the matched profile(s) — never all four
  "hook": true,                              # install .omp/extensions/done-gate.ts (auto-discovered by OMP)
  "templates": { "docs/plans/ROADMAP.md": "templates/ROADMAP.md", ... }   # target-rel -> source-rel
}

Guarantees:
  - never clobbers: an existing target file is skipped and reported (idempotent re-runs)
  - installs only under <target>/.omp/ (skills, extensions/done-gate.ts, goodbehavior/, plus planned templates)
  - the extension is plain TypeScript — no settings file, executable bit, or interpreter wiring; OMP discovers it
  - manifest at <target>/.omp/goodbehavior/manifest.json records source, sourceCommit and a
    sha256 per file AS INSTALLED (merged with any existing manifest)
Reports JSON on stdout: {"created": [...], "skipped": [...], "warnings": [...]}.
"""
import argparse, hashlib, json, os, shutil, subprocess, sys
from datetime import datetime, timezone

HOOK_REL = ".omp/extensions/done-gate.ts"


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def source_commit(source):
    try:
        out = subprocess.run(["git", "-C", source, "rev-parse", "HEAD"],
                             capture_output=True, text=True, check=True)
        return out.stdout.strip()
    except Exception:
        return None


def plan_files(plan):
    """Yield (target_rel, source_rel) for every file the plan installs."""
    src = plan["source"]
    for skill in plan.get("skills", []):
        skill_dir = os.path.join(src, ".omp", "skills", skill)
        if not os.path.isdir(skill_dir):
            raise SystemExit(f"error: skill not found in source: {skill}")
        for root, _, files in os.walk(skill_dir):
            for f in files:
                full = os.path.join(root, f)
                rel = os.path.relpath(full, src)
                yield rel, rel
    for profile in plan.get("profiles", []):
        src_rel = os.path.join("templates", "profiles", f"{profile}.md")
        if not os.path.isfile(os.path.join(src, src_rel)):
            raise SystemExit(f"error: profile not found in source: {profile}")
        yield os.path.join(".omp", "goodbehavior", "profiles", f"{profile}.md"), src_rel
    for tgt_rel, src_rel in plan.get("templates", {}).items():
        if not os.path.isfile(os.path.join(src, src_rel)):
            raise SystemExit(f"error: template not found in source: {src_rel}")
        yield tgt_rel, src_rel
    if plan.get("hook"):
        yield HOOK_REL, HOOK_REL



def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--plan", required=True, help="path to the plan JSON")
    ap.add_argument("--dry-run", action="store_true", help="report what would happen; write nothing")
    args = ap.parse_args()

    with open(args.plan) as f:
        plan = json.load(f)
    source, target = os.path.abspath(plan["source"]), os.path.abspath(plan["target"])
    if source == target:
        raise SystemExit("error: refusing to install the source into itself")
    if not os.path.isdir(source):
        raise SystemExit(f"error: source not found: {source}")
    if not os.path.isdir(target):
        raise SystemExit(f"error: target not found: {target}")

    report = {"created": [], "skipped": [], "warnings": []}
    commit = source_commit(source)
    if commit is None:
        report["warnings"].append(
            "source has no git commit — sourceCommit=null; /update-goodbehavior cannot 3-way-merge "
            "until the source is committed")

    manifest_path = os.path.join(target, ".omp", "goodbehavior", "manifest.json")
    manifest = {"source": source, "sourceCommit": commit,
                "installedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                "updatedAt": None, "files": {}}
    if os.path.isfile(manifest_path):
        try:
            with open(manifest_path) as f:
                existing = json.load(f)
            manifest["files"] = existing.get("files", {})
            manifest["installedAt"] = existing.get("installedAt", manifest["installedAt"])
        except Exception:
            report["warnings"].append("existing manifest was unreadable — rebuilding it")

    for tgt_rel, src_rel in plan_files(plan):
        dst = os.path.join(target, tgt_rel)
        if os.path.exists(dst):
            report["skipped"].append(tgt_rel)
            continue
        if not args.dry_run:
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            shutil.copy2(os.path.join(source, src_rel), dst)
            manifest["files"][tgt_rel] = {"from": src_rel.replace(os.sep, "/"), "sha256": sha256(dst)}
        report["created"].append(tgt_rel)

    if not args.dry_run:
        os.makedirs(os.path.dirname(manifest_path), exist_ok=True)
        with open(manifest_path, "w") as f:
            json.dump(manifest, f, indent=2)
            f.write("\n")

    json.dump(report, sys.stdout, indent=2)
    print()
    return 0


if __name__ == "__main__":
    sys.exit(main())
