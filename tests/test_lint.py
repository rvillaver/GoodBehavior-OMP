#!/usr/bin/env python3
"""Structural + drift lint for the bundle itself.

Structure: profiles are well-formed and indexed; skill frontmatter names match their dirs; JSON
artifacts parse; python artifacts compile.
Drift: the invariant layer (CLAUDE.md core, verify/audit/roadmap skills, the hook, generic
templates) must not re-acquire dev-only phrasing — the exact regression the profile layer fixed.
Dev phrasing is allowed only where the development instantiation legitimately lives."""
import json, os, py_compile, re, sys, tempfile

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PROFILES = ("development", "analysis", "research", "creative")
SLOTS = ("**the-real-thing:**", "**verify:**", "**evidence:**")

# files that must stay artifact-agnostic (the invariant layer)
INVARIANT_FILES = [
    ".omp/AGENTS.md",
    ".omp/skills/verify-goodbehavior/SKILL.md",
    ".omp/skills/audit-goodbehavior/SKILL.md",
    ".omp/skills/roadmap-goodbehavior/SKILL.md",
    ".omp/extensions/done-gate.ts",
    "templates/MEMORY.md",
    "templates/UAT-PLAN.md",
    "templates/ROADMAP.md",
    "templates/PRODUCTION-BACKLOG.md",
]
# dev-only phrasing that must not reappear there as a UNIVERSAL claim. Lines that mention a
# profile ("per the profile", "for software", "development") are instantiations, not regressions.
DEV_CODED = re.compile(r"(UI \+ backend|the real UI|UI \*and\* (the real )?backend|run the app\b)", re.I)
PROFILE_SCOPED = re.compile(r"(profile|for software|development|dev app|dev project)", re.I)


def read(rel):
    with open(os.path.join(ROOT, rel), encoding="utf-8") as f:
        return f.read()


def main():
    failures = []

    def check(label, cond, detail=""):
        print(f"  {'PASS' if cond else 'FAIL'}  {label}" + (f" — {detail}" if not cond and detail else ""))
        if not cond:
            failures.append(label)

    # profiles well-formed
    for p in PROFILES:
        body = read(f"templates/profiles/{p}.md")
        check(f"profile {p}: three slots + use-when + truth-source",
              all(s in body for s in SLOTS) and "use-when:" in body and "truth-source:" in body)
    index = read("templates/profiles/INDEX.md")
    for p in PROFILES:
        check(f"INDEX links {p}.md", f"({p}.md)" in index)

    # skill frontmatter name == dir name
    skills_dir = os.path.join(ROOT, ".omp", "skills")
    for d in sorted(os.listdir(skills_dir)):
        skill = os.path.join(skills_dir, d, "SKILL.md")
        if not os.path.isfile(skill):
            continue
        m = re.search(r"^name: (.+)$", read(f".omp/skills/{d}/SKILL.md"), re.M)
        check(f"skill {d}: frontmatter name matches dir", bool(m) and m.group(1).strip() == d)

    # JSON artifacts parse
    for rel in ("templates/manifest.json",):
        try:
            json.loads(re.sub(r"^\s*//.*$", "", read(rel), flags=re.M))
            check(f"{rel} parses as JSON", True)
        except Exception as e:
            check(f"{rel} parses as JSON", False, str(e))

    # python artifacts compile (the done-gate is TypeScript — its parse/transpile coverage lives
    # in tests/done-gate.test.ts, which imports the module under bun)
    with tempfile.TemporaryDirectory() as td:
        for rel in ("scripts/install.py", "scripts/update.py"):
            try:
                py_compile.compile(os.path.join(ROOT, rel), doraise=True,
                                   cfile=os.path.join(td, os.path.basename(rel) + "c"))
                check(f"{rel} compiles", True)
            except Exception as e:
                check(f"{rel} compiles", False, str(e))

    # drift: invariant layer must not re-acquire unscoped dev-only phrasing
    for rel in INVARIANT_FILES:
        offenders = [ln.strip() for ln in read(rel).splitlines()
                     if DEV_CODED.search(ln) and not PROFILE_SCOPED.search(ln)]
        check(f"{rel}: no unscoped dev-coded phrasing", not offenders,
              f"e.g. {offenders[0][:90]!r}" if offenders else "")

    # upward-infection guard: nothing machine-local may flow into the bundle. Promotions must be
    # identity-stripped, generic form (TODO.md's standing rule) — a /Users/... path is the most
    # reliable mechanical tell that a project-local detail leaked upstream.
    local_path = re.compile(r"(/Users/|/home/\w|[A-Z]:\\Users)")
    leaks = []
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in (".git", "node_modules", "__pycache__", "tests", "docs")]
        for fn in filenames:
            if not fn.endswith((".md", ".py", ".json", ".ts")):
                continue
            rel = os.path.relpath(os.path.join(dirpath, fn), ROOT)
            hits = [ln.strip()[:90] for ln in read(rel).splitlines() if local_path.search(ln)]
            leaks += [f"{rel}: {h}" for h in hits]
    check("bundle: no machine-local absolute paths (upward-infection guard)", not leaks,
          leaks[0] if leaks else "")

    print(f"test_lint: {'FAILED: ' + '; '.join(failures) if failures else 'all passed'}")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
