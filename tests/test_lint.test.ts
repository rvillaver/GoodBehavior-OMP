#!/usr/bin/env bun
/** Structural + drift lint for the bundle itself.
 * Structure: profiles well-formed and indexed; skill frontmatter names match dirs; JSON artifacts parse.
 * Drift: invariant layer must not re-acquire dev-only phrasing.
 * Upward-infection guard: no machine-local absolute paths in bundle. */

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve, relative } from "node:path";
import { tmpdir } from "node:os";
import { execSync } from "node:child_process";

const ROOT = resolve(join(import.meta.dirname, ".."));
const PROFILES = ["development", "analysis", "research", "creative"];
const SLOTS = ["**the-real-thing:**", "**verify:**", "**evidence:**"];

const INVARIANT_FILES = [
  ".omp/AGENTS.md",
  ".omp/skills/verify-goodbehavior/SKILL.md",
  ".omp/skills/audit-goodbehavior/SKILL.md",
  ".omp/skills/roadmap-goodbehavior/SKILL.md",
  ".omp/extensions/done-gate.ts",
  "templates/MEMORY.md",
  "templates/UAT-PLAN.md",
  "templates/ROADMAP.md",
  "templates/PRODUCTION-BACKLOG.md",
];

const DEV_CODED = /(UI \+ backend|the real UI|UI \*and\* (the real )?backend|run the app\b)/i;
const PROFILE_SCOPED = /(profile|for software|development|dev app|dev project)/i;
const LOCAL_PATH = /(\/Users\/|\/home\/\w|[A-Z]:\\Users)/;

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

const check = (label: string, cond: boolean, detail = "") => {
  console.log(`  ${cond ? "PASS" : "FAIL"}  ${label}${!cond && detail ? ` — ${detail}` : ""}`);
  return cond;
};

let ok = true;

// Profiles well-formed
for (const p of PROFILES) {
  const body = read(`templates/profiles/${p}.md`);
  ok &= check(`profile ${p}: three slots + use-when + truth-source`,
    SLOTS.every(s => body.includes(s)) && body.includes("use-when:") && body.includes("truth-source:"));
}
const index = read("templates/profiles/INDEX.md");
for (const p of PROFILES) ok &= check(`INDEX links ${p}.md`, index.includes(`(${p}.md)`));

// Skill frontmatter name == dir name
const skillsDir = join(ROOT, ".omp", "skills");
for (const d of readdirSync(skillsDir).sort()) {
  const skill = join(skillsDir, d, "SKILL.md");
  if (!existsSync(skill)) continue;
  const m = readFileSync(skill, "utf8").match(/^name:\s*(.+)$/m);
  ok &= check(`skill ${d}: frontmatter name matches dir`, !!m && m[1].trim() === d);
}

// JSON artifacts parse
for (const rel of ["templates/manifest.json"]) {
  try { JSON.parse(read(rel)); ok &= check(`${rel} parses as JSON`, true); }
  catch (e) { ok &= check(`${rel} parses as JSON`, false, String(e)); }
}

// TypeScript artifacts compile (done-gate tested separately via bun).
// Syntax-only check via Bun's transpiler — running the scripts bare would fail on
// their own argument validation, which says nothing about compilation.
const transpiler = new Bun.Transpiler({ loader: "ts" });
const tsFiles = ["scripts/install.ts", "scripts/update.ts", ".omp/extensions/done-gate.ts"];
for (const rel of tsFiles) {
  try {
    transpiler.transformSync(readFileSync(join(ROOT, rel), "utf8"));
    ok &= check(`${rel} compiles`, true);
  } catch (e) {
    ok &= check(`${rel} compiles`, false, String(e));
  }
}

// Drift: invariant layer must not re-acquire unscoped dev-only phrasing
for (const rel of INVARIANT_FILES) {
  const offenders = read(rel).split("\n")
    .map((ln, i) => ({ line: i + 1, text: ln.trim() }))
    .filter(x => DEV_CODED.test(x.text) && !PROFILE_SCOPED.test(x.text));
  ok &= check(`drift: ${rel} clean of unscoped dev phrasing`, offenders.length === 0,
    offenders[0] ? `line ${offenders[0].line}: ${offenders[0].text.slice(0, 90)}` : "");
}

// Upward-infection guard: no machine-local absolute paths
const leaks: string[] = [];
function walk(dir: string) {
  for (const entry of readdirSync(dir)) {
    if ([".git", "node_modules", "__pycache__", "tests", "docs"].includes(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full);
    else {
      const rel = relative(ROOT, full);
      const content = readFileSync(full, "utf8");
      const matches = content.match(LOCAL_PATH);
      if (matches) leaks.push(`${rel}: ${matches[0]}`);
    }
  }
}
walk(ROOT);
ok &= check("bundle: no machine-local absolute paths (upward-infection guard)", leaks.length === 0,
  leaks[0] || "");

console.log(`\ntest_lint: ${ok ? "all passed" : "FAILED"}`);
process.exit(ok ? 0 : 1);