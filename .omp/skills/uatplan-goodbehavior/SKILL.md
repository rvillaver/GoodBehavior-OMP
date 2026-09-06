---
name: uatplan-goodbehavior
description: Build and maintain a manual UAT plan — every feature, how a human exercises it for real, expected result, pass/fail. Use to make verification coverage durable, not ad hoc.
---

Produce and keep current a **human-followable UAT plan** — the durable counterpart to automated tests and to the one-shot
`/skill:verify-goodbehavior` drive. Where verify proves *one* change live, the UAT plan is the *standing map* of what to test
across the whole product and whether each case currently passes. Output: `docs/qa/UAT-PLAN.md` (sections per feature
area, a case table per section, the reporting protocol at the foot) — a **default, not a prescription**: if the project already keeps a manual test catalog
(whatever it's named), maintain THAT instead of creating a parallel one. Kept in sync with the feature set as it grows.

## Organize by feature set (cross-referenced to journeys/personas)
Enumerate the **real, as-built feature set** from the code/screens — not from memory or the design doc alone — grouped
into areas (identity, each operator surface, the core loop, public/landing, …). If the project has persona/journey docs,
cross-reference them so coverage is auditable against the *intended* journeys. Where roles exist, include a **permutation
matrix** (role × page/action: who can do what, and what the blocked case looks like).

## Per case
A stable **case ID** (e.g. `TC-<area><n>`), and for each:
1. **Steps** — the exact consumer actions, end to end, on the real thing per the profile (a dev app: navigate/fill/submit;
   a dataset: run + inspect the output; findings: trace a claim to its source; a deck: walk it as delivered).
2. **Expected** — the observable result to compare against. For software, UI state *and* the backend effect (row written,
   count moved, state advanced) — UI-only expectations miss half the bugs; for other profiles, the profile's evidence
   (validated output, source-backed claim, the artifact as the audience sees it).
3. **Result** — `[ ] Pass [ ] Fail` + notes, filled when the case is actually driven.

Flag **known/expected gaps** explicitly (blocked-on-X, by-design-absent) so a fail there isn't misread as a regression.

## Keep it live
- It is **ongoing, not one-shot.** When a feature ships, add or adjust its cases in the *same* change; when a behavior is
  ratified as by-design, record it. Supersede stale cases explicitly rather than silently deleting — so a once-passing
  case can't quietly mislead. **Keep that history in `docs/qa/archive/`, not in the live plan**: a retired case moves
  there (dated), leaving one line in the plan saying it retired and why. A plan that is mostly retired cases is no
  longer a checklist anyone can read. If you can't tell whether a case is retired, leave it live.
- Mark each case honestly: `Pass` only with firsthand live evidence (`✔`), never a relayed/assumed result (`⚠`). The
  whole value of the plan is that its green is *trustworthy*.

## How it wires into the loop
- `/skill:gate-build-goodbehavior` closes a phase by driving that phase's UAT cases through `/skill:verify-goodbehavior` — a phase
  isn't done until its cases pass live, user-confirmed.
- `/skill:audit-goodbehavior` coverage is checked against this plan: a real feature with **no UAT case** is itself a coverage gap.
- Put a short **reporting protocol** at the foot (case ID, role, page/URL, steps, saw-vs-expected, time, screenshot) so
  human testers log issues consistently and patterns are visible.

## Anti-patterns
- A green automated suite is **not** a passed UAT plan — this is the human / real-app layer that catches what unit tests
  can't. Necessary, not sufficient.
- Enumerating from memory or the design doc instead of the **as-built** surface (cite the real screens/endpoints).
- A plan that rots: cases not updated when the feature changed, so its green no longer means anything.
