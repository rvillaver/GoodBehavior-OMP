---
name: verify-goodbehavior
description: Verify a change by exercising the real thing the way its consumer would, then capture evidence. Use to confirm a change works before calling it done — a passing test alone does not count.
---

Prove a change actually does what it's supposed to by observing the real thing — not by reading the diff, not by a green
test, not by describing it. This skill is self-contained: it does not call other skills.

**Loop position:** called per item by `/skill:gate-build-goodbehavior`, or on its own to confirm one change.

**The active profile** (`.omp/goodbehavior/profiles/<name>.md`, already in your instructions) defines
**the-real-thing / verify / evidence** for this project's type. The steps below are the development instantiation; for a
non-dev profile, substitute that profile's slots (e.g. re-run on real data + validate; re-check claims vs sources;
walk the delivered artifact + fact-check it). The procedure shape is the same; what you run and what counts changes.

## Procedure
1. **Know the intended behavior** — what should the consumer see/get after this change? State it in one sentence.
2. **Produce the real thing** — run/serve/build/render it the project's real way per the profile (see the project's
   .omp/AGENTS.md / memory for build-deploy traps). Confirm you're on the **current build/output**, not a stale cache or old draft.
3. **Exercise it like the consumer** — drive the real flow end to end: for software, a user's steps through UI +
   backend; for data, re-run on real input and validate the output; for research, re-check each claim against its
   source; for a creative artifact, experience the delivered form and fact-check it.
4. **Capture evidence** — the profile's evidence: a screenshot/recording, the real response/state change, the
   validation output, the citation ledger, or the artifact walkthrough + fact-check log. Ideally beside the reference.
5. **Compare to intent** — does what you observed match step 1 and the reference? Note any delta.

## Report honestly
- If it matches: present the **evidence**, and frame it as **"verified — your confirmation needed,"** not "done." The
  user is the done-gate.
- If it doesn't: say so with the actual failure (message/screenshot), and either fix or log it.
- If you couldn't run it live (blocked/no access): say that plainly — do **not** substitute a passing test or your
  description for live verification. Record the blocker.

> If the project keeps a UAT plan (`/skill:uatplan-goodbehavior`), drive the relevant case(s) from it and record the
> Pass/Fail there — verify proves the change live; the UAT plan is where that evidence persists and stays auditable.

## Anti-patterns (these are NOT verification)
- "Tests pass" / "build succeeded" → necessary, not sufficient.
- "I changed the code so it should work."
- A screenshot of a cached/old build.
- Narrating the expected behavior without observing it.
