#!/usr/bin/env bun
/** install.ts round-trip test — installs the REAL bundle into a temp target and checks guarantees:
 * only planned profiles land, manifest records true sha256s, existing files never clobbered,
 * nothing lands outside <target>/.omp/, and a re-run is a clean no-op. */

import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { execSync } from "node:child_process";

const ROOT = resolve(join(import.meta.dirname, ".."));
const INSTALL = join(ROOT, "scripts", "install.ts");

function sha256(path: string): string {
  const h = createHash("sha256");
  h.update(readFileSync(path));
  return h.digest("hex");
}

function runInstall(planPath: string) {
  const r = execSync(`bun "${INSTALL}" --plan "${planPath}"`, { encoding: "utf8", stdio: "pipe" });
  return JSON.parse(r.trim()) as { created: string[]; skipped: string[]; warnings: string[] };
}

const check = (label: string, cond: boolean, detail = "") => {
  console.log(`  ${cond ? "PASS" : "FAIL"}  ${label}${!cond && detail ? ` — ${detail}` : ""}`);
  return cond;
};

const tmp = join(tmpdir(), `gb-test-${Date.now()}`);
mkdirSync(tmp, { recursive: true });

try {
  const target = join(tmp, "target");
  mkdirSync(target);

  // Existing project file that must never be clobbered
  const sentinelDir = join(target, ".omp", "skills", "verify-goodbehavior");
  mkdirSync(sentinelDir, { recursive: true });
  const sentinel = join(sentinelDir, "SKILL.md");
  writeFileSync(sentinel, "LOCAL ADAPTATION — do not clobber\n");

  // Pre-existing project doc outside .omp/ that installer must never touch
  const agents = join(target, "AGENTS.md");
  writeFileSync(agents, "project-owned principles\n");

  const plan = {
    source: ROOT,
    target,
    skills: ["verify-goodbehavior", "learn-goodbehavior", "update-goodbehavior"],
    profiles: ["analysis", "development"],
    hook: true,
    templates: { "docs/plans/ROADMAP.md": "templates/ROADMAP.md" },
  };
  const planPath = join(tmp, "plan.json");
  writeFileSync(planPath, JSON.stringify(plan));

  const report = runInstall(planPath);

  let ok = true;
  ok &= check("planned skills copied", existsSync(join(target, ".omp", "skills", "learn-goodbehavior", "SKILL.md")));
  ok &= check("planned profiles copied",
    existsSync(join(target, ".omp", "goodbehavior", "profiles", "analysis.md")) &&
    existsSync(join(target, ".omp", "goodbehavior", "profiles", "development.md")));
  ok &= check("UNplanned profiles absent (minimal footprint)",
    !existsSync(join(target, ".omp", "goodbehavior", "profiles", "creative.md")) &&
    !existsSync(join(target, ".omp", "goodbehavior", "profiles", "research.md")));
  ok &= check("template landed", existsSync(join(target, "docs", "plans", "ROADMAP.md")));
  ok &= check("done-gate extension landed", existsSync(join(target, ".omp", "extensions", "done-gate.ts")));
  ok &= check("existing file never clobbered", readFileSync(sentinel, "utf8").includes("LOCAL ADAPTATION"));
  ok &= check("clobber-skip reported", report.skipped.some(s => s.includes("verify-goodbehavior")));
  ok &= check("project AGENTS.md untouched", readFileSync(agents, "utf8") === "project-owned principles\n");

  const mpath = join(target, ".omp", "goodbehavior", "manifest.json");
  const manifest = JSON.parse(readFileSync(mpath, "utf8")) as { sourceCommit: string; files: Record<string, { sha256: string }> };
  ok &= check("manifest has sourceCommit", !!manifest.sourceCommit);
  const hashesOk = Object.entries(manifest.files).every(([k, v]) => sha256(join(target, k)) === v.sha256);
  ok &= check("manifest sha256s match files as installed", hashesOk);
  ok &= check("manifest tracks installed profiles", ".omp/goodbehavior/profiles/analysis.md" in manifest.files);
  ok &= check("manifest tracks done-gate extension", ".omp/extensions/done-gate.ts" in manifest.files);

  function walk(dir: string): string[] {
    const res: string[] = [];
    function rec(d: string) {
      for (const entry of require("node:fs").readdirSync(d)) {
        const full = join(d, entry);
        const stat = require("node:fs").statSync(full);
        if (stat.isDirectory()) rec(full);
        else res.push(full.slice(target.length + 1));
      }
    }
    rec(dir);
    return res;
  }
  const allFiles = walk(target);
  const outsideOmp = allFiles.filter(f => !f.startsWith(".omp/") && f !== "docs/plans/ROADMAP.md" && f !== "AGENTS.md");
  ok &= check("nothing installed outside .omp/ (beyond planned templates)", outsideOmp.length === 0, outsideOmp.slice(0, 3).join(", "));

  // Idempotency: re-run must create nothing new
  const report2 = runInstall(planPath);
  ok &= check("re-run creates nothing", report2.created.length === 0);
  const gateHash = sha256(join(target, ".omp", "extensions", "done-gate.ts"));
  const manifest2 = JSON.parse(readFileSync(mpath, "utf8"));
  ok &= check("re-run leaves extension untouched", manifest2.files[".omp/extensions/done-gate.ts"].sha256 === gateHash);

  console.log(`\ntest_install: ${ok ? "all passed" : "FAILED"}`);
  process.exit(ok ? 0 : 1);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
