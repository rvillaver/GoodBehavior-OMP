#!/usr/bin/env bun
/** GoodBehavior deterministic installer — the mechanical half of /adopt-goodbehavior.
 * The adopt skill does the JUDGMENT; this script does the MECHANICS identically every time.
 *
 * Usage: bun scripts/install.ts --plan plan.json [--dry-run]
 *
 * Plan format:
 * {
 *   "source": "/abs/path/to/GoodBehavior-OMP",
 *   "target": "/abs/path/to/project",
 *   "skills": ["audit-goodbehavior", "verify-goodbehavior", ...],
 *   "profiles": ["analysis", "development"],
 *   "hook": true,
 *   "templates": { "docs/plans/ROADMAP.md": "templates/ROADMAP.md", ... }
 * }
 *
 * Guarantees: never clobbers; installs only under <target>/.omp/ (plus planned templates);
 * manifest records sha256 per file AS INSTALLED (merged with any existing manifest).
 * Reports JSON: {"created": [...], "skipped": [...], "warnings": [...]}.
 */

import { parseArgs } from "node:util";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve, relative, dirname, sep } from "node:path";
import { execSync } from "node:child_process";

const HOOK_REL = ".omp/extensions/done-gate.ts";

interface Plan {
  source: string;
  target: string;
  skills?: string[];
  profiles?: string[];
  hook?: boolean;
  templates?: Record<string, string>;
}

interface Manifest {
  source: string;
  sourceCommit: string | null;
  installedAt: string;
  updatedAt: string | null;
  files: Record<string, { from: string; sha256: string }>;
}

interface Report {
  created: string[];
  skipped: string[];
  warnings: string[];
}

function sha256(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function sourceCommit(source: string): string | null {
  try { return execSync("git rev-parse HEAD", { cwd: source, encoding: "utf8", stdio: "pipe" }).trim(); }
  catch { return null; }
}

function* planFiles(plan: Plan): Generator<[string, string]> {
  const src = plan.source;
  for (const skill of plan.skills ?? []) {
    const skillDir = join(src, ".omp", "skills", skill);
    if (!existsSync(skillDir) || !statSync(skillDir).isDirectory()) throw new Error(`skill not found: ${skill}`);
    const stack = [skillDir];
    while (stack.length > 0) {
      const dir = stack.pop()!;
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) { stack.push(full); continue; }
        const rel = relative(src, full).replaceAll(sep, "/");
        yield [rel, rel];
      }
    }
  }
  for (const profile of plan.profiles ?? []) {
    const srcRel = join("templates", "profiles", `${profile}.md`);
    if (!existsSync(join(src, srcRel))) throw new Error(`profile not found: ${profile}`);
    yield [join(".omp", "goodbehavior", "profiles", `${profile}.md`).replaceAll(sep, "/"), srcRel];
  }
  for (const [tgtRel, srcRel] of Object.entries(plan.templates ?? {})) {
    if (!existsSync(join(src, srcRel))) throw new Error(`template not found: ${srcRel}`);
    yield [tgtRel, srcRel];
  }
  if (plan.hook) yield [HOOK_REL, HOOK_REL];
}

function main(): number {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: { plan: { type: "string" }, "dry-run": { type: "boolean" } },
    strict: true,
    allowPositionals: true,
  });

  const planPath = values.plan;
  const dryRun = values["dry-run"] ?? false;
  if (!planPath) { console.error("error: --plan is required"); return 1; }

  let plan: Plan;
  try { plan = JSON.parse(readFileSync(planPath, "utf8")); }
  catch (e) { console.error(`error: failed to read plan: ${e}`); return 1; }

  const source = resolve(plan.source), target = resolve(plan.target);
  if (source === target) { console.error("error: refusing to install into itself"); return 1; }
  if (!existsSync(source) || !statSync(source).isDirectory()) { console.error(`error: source not found: ${source}`); return 1; }
  if (!existsSync(target) || !statSync(target).isDirectory()) { console.error(`error: target not found: ${target}`); return 1; }

  const report: Report = { created: [], skipped: [], warnings: [] };
  const commit = sourceCommit(source);
  if (!commit) report.warnings.push("source has no git commit — sourceCommit=null; /update-goodbehavior cannot 3-way-merge until committed");

  const manifestPath = join(target, ".omp", "goodbehavior", "manifest.json");
  let manifest: Manifest = { source, sourceCommit: commit, installedAt: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"), updatedAt: null, files: {} };

  if (existsSync(manifestPath)) {
    try {
      const existing = JSON.parse(readFileSync(manifestPath, "utf8")) as Manifest;
      manifest.files = existing.files ?? {};
      manifest.installedAt = existing.installedAt ?? manifest.installedAt;
    } catch { report.warnings.push("existing manifest unreadable — rebuilding"); }
  }

  for (const [tgtRel, srcRel] of planFiles(plan)) {
    const dst = join(target, tgtRel);
    if (existsSync(dst)) { report.skipped.push(tgtRel); continue; }
    if (!dryRun) {
      mkdirSync(dirname(dst), { recursive: true });
      copyFileSync(join(source, srcRel), dst);
      manifest.files[tgtRel] = { from: srcRel.replaceAll(sep, "/"), sha256: sha256(dst) };
    }
    report.created.push(tgtRel);
  }

  if (!dryRun) {
    mkdirSync(dirname(manifestPath), { recursive: true });
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  }

  console.log(JSON.stringify(report, null, 2));
  return 0;
}

process.exit(main());
