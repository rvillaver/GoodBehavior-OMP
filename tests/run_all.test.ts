#!/usr/bin/env bun
/** GoodBehavior self-test — the bundle held to its own standard: verified, not self-declared.
 * Runs every tests/test_*.test.ts plus the done-gate TypeScript suite (bun). */

import { readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { execSync } from "node:child_process";

const HERE = resolve(join(import.meta.dirname));

function main(): number {
  const suites = readdirSync(HERE).filter(f => f.startsWith("test_") && f.endsWith(".test.ts")).sort();
  const failed: string[] = [];

  for (const suite of suites) {
    console.log(`\n== ${suite} ==`);
    try {
      execSync(`bun run "${join(HERE, suite)}"`, { stdio: "inherit" });
    } catch {
      failed.push(suite);
    }
  }

  const gate = join(HERE, "done_gate.test.ts");
  try {
    console.log(`\n== done_gate.test.ts (bun) ==`);
    execSync(`bun run "${gate}"`, { stdio: "inherit" });
  } catch {
    failed.push("done_gate.test.ts");
  }

  console.log(`\n${"=".repeat(40)}`);
  if (failed.length) {
    console.log(`FAILED: ${failed.join(", ")}`);
    return 1;
  }
  console.log(`all suites passed`);
  return 0;
}

process.exit(main());