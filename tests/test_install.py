#!/usr/bin/env python3
"""install.py round-trip test — installs the REAL bundle into a temp target and checks the guarantees:
only the planned profiles land (never all four), the manifest records true sha256s, existing files are
never clobbered, nothing lands outside <target>/.omp/, and a re-run is a clean no-op."""
import hashlib, json, os, subprocess, sys, tempfile

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
INSTALL = os.path.join(ROOT, "scripts", "install.py")


def sha256(path):
    with open(path, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()


def run_install(plan_path):
    r = subprocess.run([sys.executable, INSTALL, "--plan", plan_path], capture_output=True, text=True)
    if r.returncode != 0:
        raise AssertionError(f"install.py failed: {r.stderr}")
    return json.loads(r.stdout)


def main():
    failures = []

    def check(label, cond, detail=""):
        print(f"  {'PASS' if cond else 'FAIL'}  {label}")
        if not cond:
            failures.append(f"{label} {detail}")

    with tempfile.TemporaryDirectory() as target:
        # a fake existing project file that must never be clobbered
        os.makedirs(os.path.join(target, ".omp", "skills", "verify-goodbehavior"))
        sentinel = os.path.join(target, ".omp", "skills", "verify-goodbehavior", "SKILL.md")
        with open(sentinel, "w") as f:
            f.write("LOCAL ADAPTATION — do not clobber\n")
        # a pre-existing project doc outside .omp/ that the installer must never touch
        agents = os.path.join(target, "AGENTS.md")
        with open(agents, "w") as f:
            f.write("project-owned principles\n")

        plan = {"source": ROOT, "target": target,
                "skills": ["verify-goodbehavior", "learn-goodbehavior", "update-goodbehavior"],
                "profiles": ["analysis", "development"],
                "hook": True,
                "templates": {"docs/plans/ROADMAP.md": "templates/ROADMAP.md"}}
        plan_path = os.path.join(target, "plan.json")
        with open(plan_path, "w") as f:
            json.dump(plan, f)

        report = run_install(plan_path)

        check("planned skills copied",
              os.path.isfile(os.path.join(target, ".omp/skills/learn-goodbehavior/SKILL.md")))
        check("planned profiles copied",
              os.path.isfile(os.path.join(target, ".omp/goodbehavior/profiles/analysis.md"))
              and os.path.isfile(os.path.join(target, ".omp/goodbehavior/profiles/development.md")))
        check("UNplanned profiles absent (minimal footprint)",
              not os.path.exists(os.path.join(target, ".omp/goodbehavior/profiles/creative.md"))
              and not os.path.exists(os.path.join(target, ".omp/goodbehavior/profiles/research.md")))
        check("template landed", os.path.isfile(os.path.join(target, "docs/plans/ROADMAP.md")))
        check("done-gate extension landed",
              os.path.isfile(os.path.join(target, ".omp/extensions/done-gate.ts")))
        with open(sentinel) as f:
            check("existing file never clobbered", "LOCAL ADAPTATION" in f.read())
        check("clobber-skip reported",
              any("verify-goodbehavior" in s for s in report["skipped"]))
        with open(agents) as f:
            check("project AGENTS.md untouched", f.read() == "project-owned principles\n")

        mpath = os.path.join(target, ".omp/goodbehavior/manifest.json")
        with open(mpath) as f:
            manifest = json.load(f)
        check("manifest has sourceCommit", bool(manifest.get("sourceCommit")))
        hashes_ok = all(sha256(os.path.join(target, k)) == v["sha256"]
                        for k, v in manifest["files"].items())
        check("manifest sha256s match files as installed", hashes_ok)
        check("manifest tracks the installed profiles",
              ".omp/goodbehavior/profiles/analysis.md" in manifest["files"])
        check("manifest tracks the done-gate extension",
              ".omp/extensions/done-gate.ts" in manifest["files"])

        everything_outside_omp = [
            os.path.join(dirpath, fn)
            for dirpath, dirnames, filenames in os.walk(target)
            for fn in filenames
            if ".omp" not in os.path.relpath(dirpath, target).split(os.sep)
            and os.path.relpath(os.path.join(dirpath, fn), target) not in
            ("plan.json", "AGENTS.md", os.path.join("docs", "plans", "ROADMAP.md"))
        ]
        check("nothing installed outside .omp/ (beyond planned templates)", not everything_outside_omp,
              str(everything_outside_omp[:3]))

        # idempotency: re-run must create nothing new
        report2 = run_install(plan_path)
        check("re-run creates nothing", report2["created"] == [])
        gate_hash = sha256(os.path.join(target, ".omp/extensions/done-gate.ts"))
        manifest2 = json.load(open(mpath))
        check("re-run leaves the extension untouched",
              manifest2["files"][".omp/extensions/done-gate.ts"]["sha256"] == gate_hash)

    print(f"test_install: {'FAILED: ' + '; '.join(failures) if failures else 'all passed'}")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
