#!/usr/bin/env python3
"""GoodBehavior self-test — the bundle held to its own standard: verified, not self-declared.

Runs every tests/test_*.py as a subprocess plus the done-gate TypeScript suite (bun or deno).
One command, exit 0 = green:

    python3 tests/run_all.py
"""
import os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))


def main():
    suites = sorted(f for f in os.listdir(HERE) if f.startswith("test_") and f.endswith(".py"))
    failed = []
    for suite in suites:
        print(f"\n== {suite} ==")
        r = subprocess.run([sys.executable, os.path.join(HERE, suite)])
        if r.returncode != 0:
            failed.append(suite)
    import shutil
    gate = os.path.join(HERE, "done_gate.test.ts")
    if shutil.which("bun"):
        print("\n== done_gate.test.ts (bun) ==")
        r = subprocess.run(["bun", "run", gate])
    elif shutil.which("deno"):
        print("\n== done_gate.test.ts (deno) ==")
        r = subprocess.run(["deno", "run", "--no-check", "-A", gate])
    else:
        print("\nSKIP done_gate.test.ts — neither bun nor deno on PATH")
        r = None
    if r is not None and r.returncode != 0:
        failed.append("done_gate.test.ts")
    print(f"\n{'=' * 40}")
    if failed:
        print(f"FAILED: {', '.join(failed)}")
        return 1
    print(f"all suites passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
