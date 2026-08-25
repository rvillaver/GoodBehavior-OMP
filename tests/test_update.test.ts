#!/usr/bin/env bun
/** update.ts 3-way-merge round-trip — hermetic mini-source repo, all four reconciliation paths:
 *   a.md  untouched locally, changed upstream        -> fast-forwarded ("updated")
 *   b.md  adapted locally, compatible upstream change -> cleanly merged ("merged")
 *   c.md  adapted locally, overlapping upstream change-> conflict markers ("conflict", exit 2)
 *   d.md  removed upstream                            -> kept locally, reported ("removed_upstream")
 * Then: manifest advanced to new commit, re-run reports "already up to date". */

import { mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { execSync, execFileSync } from "node:child_process";

const ROOT = resolve(join(import.meta.dirname, ".."));
const INSTALL = join(ROOT, "scripts", "install.ts");
const UPDATE = join(ROOT, "scripts", "update.ts");

const BASE_BODY = "line1\nline2\nline3\nline4\nline5\n";

function git(repo: string, ...args: string[]): string {
  const r = execFileSync("git", ["-C", repo, "-c", "user.name=t", "-c", "user.email=t@t", ...args], { encoding: "utf8", stdio: "pipe" });
  return r.trim();
}

function write(repo: string, rel: string, content: string) {
  const p = join(repo, rel);
  mkdirSync(join(p, ".."), { recursive: true });
  writeFileSync(p, content);
}

function sha256(path: string): string {
  const h = require("node:crypto").createHash("sha256");
  h.update(readFileSync(path));
  return h.digest("hex");
}

function runInstall(planPath: string) {
  const r = execSync(`bun "${INSTALL}" --plan "${planPath}"`, { encoding: "utf8", stdio: "pipe" });
  return JSON.parse(r.trim());
}

function runUpdate(target: string, opts: { source?: string; dryRun?: boolean } = {}) {
  let cmd = `bun "${UPDATE}" --target "${target}"`;
  if (opts.source) cmd += ` --source "${opts.source}"`;
  if (opts.dryRun) cmd += ` --dry-run`;
  let code = 0, stdout = "";
  try {
    stdout = execSync(cmd, { encoding: "utf8", stdio: "pipe" });
  } catch (e) {
    // exit 2 = completed WITH conflicts — an expected outcome, not a crash
    const err = e as { status?: number; stdout?: string };
    code = err.status ?? 1;
    stdout = err.stdout ?? "";
  }
  return { code, report: JSON.parse(stdout.trim()) as { status: string; unchanged: string[]; updated: string[]; merged: string[]; conflict: string[]; removed_upstream: string[] } };
}

const check = (label: string, cond: boolean, detail = "") => {
  console.log(`  ${cond ? "PASS" : "FAIL"}  ${label}${!cond && detail ? ` — ${detail}` : ""}`);
  return cond;
};

const tmp = join(tmpdir(), `gb-test-${Date.now()}`);
mkdirSync(tmp, { recursive: true });

try {
  const source = join(tmp, "source");
  mkdirSync(source);
  git(source, "init");
  git(source, "commit", "--allow-empty", "-m", "init");

  // Create initial files
  write(source, "a.md", BASE_BODY);
  write(source, "b.md", BASE_BODY);
  write(source, "c.md", BASE_BODY);
  write(source, "d.md", BASE_BODY);
  git(source, "add", ".");
  git(source, "commit", "-m", "base");

  const baseCommit = git(source, "rev-parse", "HEAD");

  // Upstream changes: a line3, b+c line1 (collides with local c), d removed
  write(source, "a.md", BASE_BODY.replace("line3\n", "line3-upstream\n"));
  write(source, "b.md", BASE_BODY.replace("line1\n", "line1-upstream\n"));
  write(source, "c.md", BASE_BODY.replace("line1\n", "line1-upstream\n"));
  rmSync(join(source, "d.md"));
  git(source, "add", ".");
  git(source, "commit", "-m", "upstream changes");
  const newCommit = git(source, "rev-parse", "HEAD");

  // Target project
  const target = join(tmp, "target");
  mkdirSync(target);
  const ompDir = join(target, ".omp", "goodbehavior");
  mkdirSync(ompDir, { recursive: true });

  // As-installed state — the manifest must record THIS, so later edits look adapted
  write(target, "a.md", BASE_BODY);
  write(target, "b.md", BASE_BODY);
  write(target, "c.md", BASE_BODY);
  write(target, "d.md", BASE_BODY);

  // Manifest
  const manifest = {
    source,
    sourceCommit: baseCommit,
    installedAt: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
    updatedAt: null,
    files: {
      "a.md": { from: "a.md", sha256: sha256(join(target, "a.md")) },
      "b.md": { from: "b.md", sha256: sha256(join(target, "b.md")) },
      "c.md": { from: "c.md", sha256: sha256(join(target, "c.md")) },
      "d.md": { from: "d.md", sha256: sha256(join(target, "d.md")) },
    },
  };

  // Local adaptations, AFTER the manifest snapshot: b compatible (line5), c overlapping (line1)
  write(target, "b.md", BASE_BODY.replace("line5\n", "line5-local\n"));
  write(target, "c.md", BASE_BODY.replace("line1\n", "line1-local\n"));
  writeFileSync(join(ompDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

  // Run update
  const { code: updateCode, report } = runUpdate(target);
  let ok = true;
  ok &= check("status shows merge range", report.status === `${baseCommit.slice(0, 8)} -> ${newCommit.slice(0, 8)}`);
  ok &= check("a.md fast-forwarded", report.updated.includes("a.md"));
  ok &= check("exit code 2 on conflict", updateCode === 2);
  ok &= check("c.md conflict", report.conflict.includes("c.md"));
  ok &= check("d.md removed upstream", report.removed_upstream.includes("d.md"));

  // Verify merged content
  const bContent = readFileSync(join(target, "b.md"), "utf8");
  ok &= check("b.md has both changes", bContent.includes("line5-local") && bContent.includes("line1-upstream"));

  // c.md should have conflict markers
  const cContent = readFileSync(join(target, "c.md"), "utf8");
  ok &= check("c.md has conflict markers", cContent.includes("<<<<<<<") && cContent.includes(">>>>>>>"));

  // d.md should still exist locally
  ok &= check("d.md kept locally", existsSync(join(target, "d.md")));

  // Re-run after resolution should be clean (simulate resolution by writing clean c.md)
  write(target, "c.md", "line1\nline2\nline3-resolved\nline4\nline5\n");
  const manifestPath = join(ompDir, "manifest.json");
  const m = JSON.parse(readFileSync(manifestPath, "utf8"));
  m.files["c.md"].sha256 = sha256(join(target, "c.md"));
  writeFileSync(manifestPath, JSON.stringify(m, null, 2) + "\n");

  const report2 = runUpdate(target);
  ok &= check("re-run after resolution: already up to date", report2.report.status === "already up to date");

  console.log(`\ntest_update: ${ok ? "all passed" : "FAILED"}`);
  process.exit(ok ? 0 : 1);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}