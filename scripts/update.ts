#!/usr/bin/env bun
/** GoodBehavior deterministic updater — the mechanical half of /update-goodbehavior.
 * Reads manifest, resolves source repo, reconciles tracked files via git 3-way merge.
 * Skill keeps JUDGMENT; this script does MERGE MECHANICS identically every run.
 *
 * Usage: bun scripts/update.ts --target /path/to/project [--source /override] [--dry-run]
 *
 * Guarantees: never touches untracked files; untouched files fast-forward; adapted files 3-way merged;
 * conflicts written with markers; upstream-removed files kept locally.
 * Reports JSON: {"status": "...", "unchanged": [], "updated": [], "merged": [], "conflict": [],
 *   "restored": [], "removed_upstream": [], "warnings": []}
 * Exit: 0 clean, 1 fatal, 2 conflicts.
 */

import { parseArgs } from "node:util";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";

interface Manifest {
  source: string;
  sourceCommit: string | null;
  installedAt: string;
  updatedAt: string | null;
  files: Record<string, { from: string; sha256: string }>;
}

interface Report {
  status: string;
  unchanged: string[];
  updated: string[];
  merged: string[];
  conflict: string[];
  restored: string[];
  removed_upstream: string[];
  warnings: string[];
}

function sha256Bytes(b: Uint8Array): string {
  return createHash("sha256").update(b).digest("hex");
}

function git(source: string, ...args: string[]): Buffer | null {
  try { return execFileSync("git", ["-C", source, ...args], { stdio: "pipe" }); }
  catch { return null; }
}

function gitShow(source: string, commit: string, path: string): Uint8Array | null {
  const out = git(source, "show", `${commit}:${path}`);
  return out ? new Uint8Array(out) : null;
}

function mergeFile(ours: Uint8Array, base: Uint8Array, theirs: Uint8Array): [Uint8Array, boolean] {
  const d = join(tmpdir(), `gbu-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(d);
  try {
    const [po, pb, pt] = ["ours", "base", "theirs"].map(n => join(d, n));
    [po, pb, pt].forEach((p, i) => writeFileSync(p, [ours, base, theirs][i]));
    const out = execFileSync("git",
      ["merge-file", "-p", "-L", "local", "-L", "base", "-L", "upstream", po, pb, pt],
      { stdio: "pipe", maxBuffer: 64 * 1024 * 1024 });
    return [new Uint8Array(out), true];
  } catch (e: unknown) {
    const stdout = e && typeof e === "object" && "stdout" in e ? (e as Record<string, unknown>).stdout : null;
    return [new Uint8Array(Buffer.isBuffer(stdout) ? stdout : Buffer.alloc(0)), false];
  } finally { rmSync(d, { recursive: true, force: true }); }
}

function main(): number {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: { target: { type: "string" }, source: { type: "string" }, "dry-run": { type: "boolean" } },
    strict: true,
    allowPositionals: true,
  });

  if (!values.target) { console.error("error: --target is required"); return 1; }
  const target = resolve(values.target);
  const sourceOverride = values.source ? resolve(values.source) : null;
  const dryRun = values["dry-run"] ?? false;

  const manifestPath = join(target, ".omp", "goodbehavior", "manifest.json");
  if (!existsSync(manifestPath)) {
    console.log(JSON.stringify({ status: "no manifest — run /adopt-goodbehavior first" }, null, 2));
    return 1;
  }

  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Manifest;
  const source = resolve(sourceOverride ?? manifest.source);
  if (!existsSync(join(source, ".git"))) {
    console.log(JSON.stringify({ status: `source is not a git repo: ${source}` }, null, 2));
    return 1;
  }
  const baseCommit = manifest.sourceCommit;
  if (!baseCommit) {
    console.log(JSON.stringify({ status: "manifest sourceCommit is null — no merge base; re-adopt or overwrite manually" }, null, 2));
    return 1;
  }
  const newCommit = (git(source, "rev-parse", "HEAD")?.toString("utf8") ?? "").trim();
  if (!newCommit) { console.log(JSON.stringify({ status: "could not resolve source HEAD" }, null, 2)); return 1; }
  if (newCommit === baseCommit) { console.log(JSON.stringify({ status: "already up to date", commit: newCommit }, null, 2)); return 0; }

  const report: Report = { status: `${baseCommit.slice(0, 8)} -> ${newCommit.slice(0, 8)}`, unchanged: [], updated: [], merged: [], conflict: [], restored: [], removed_upstream: [], warnings: [] };

  for (const [key, entry] of Object.entries(manifest.files).sort(([a], [b]) => a.localeCompare(b))) {
    const theirs = gitShow(source, newCommit, entry.from);
    if (!theirs) { report.removed_upstream.push(key); continue; }

    const localPath = join(target, key);
    if (!existsSync(localPath)) {
      if (!dryRun) {
        mkdirSync(dirname(localPath), { recursive: true });
        writeFileSync(localPath, theirs);
        entry.sha256 = sha256Bytes(theirs);
      }
      report.restored.push(key);
      continue;
    }

    const ours = new Uint8Array(readFileSync(localPath));
    if (Buffer.compare(ours, theirs) === 0) {
      entry.sha256 = sha256Bytes(ours);
      report.unchanged.push(key);
      continue;
    }
    if (sha256Bytes(ours) === entry.sha256) {
      if (!dryRun) {
        writeFileSync(localPath, theirs);
        entry.sha256 = sha256Bytes(theirs);
      }
      report.updated.push(key);
      continue;
    }

    const base = gitShow(source, baseCommit, entry.from);
    if (!base) { report.warnings.push(`${key}: no base at ${baseCommit.slice(0, 8)} — left as-is`); continue; }

    const [merged, clean] = mergeFile(ours, base, theirs);
    if (!dryRun) {
      writeFileSync(localPath, merged);
      if (clean) entry.sha256 = sha256Bytes(merged);
    }
    report[clean ? "merged" : "conflict"].push(key);
  }

  if (!dryRun) {
    manifest.sourceCommit = newCommit;
    manifest.updatedAt = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  }

  console.log(JSON.stringify(report, null, 2));
  return report.conflict.length ? 2 : 0;
}

process.exit(main());