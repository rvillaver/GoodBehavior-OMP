---
name: roadmap-goodbehavior
description: Roll a gap register (or a pile of asks) into a sequenced, gated, phased plan in docs/plans/ROADMAP.md, parking low-ROI/blocked work in PRODUCTION-BACKLOG.md. Use after audit-goodbehavior, or when work needs ordering before building.
---

Turn gaps/asks into an ordered plan that the gated loop can execute. Be honest about size and value — don't let a
big-but-invisible item sit ahead of cheap high-visibility wins just because it was listed first.

> Paths below are **defaults, not prescriptions**. If adoption mapped planning onto an existing structure (a roadmap,
> handoff "next steps", an issue tracker — check AGENTS.md conventions / project memory), work THERE instead.

## Produce
- **`docs/plans/ROADMAP.md`** — the source of truth for what's next. Group into **phases**, sequenced by leverage:
  1. **Systemic, cheap, high-visibility** first (the fixes that answer the loudest complaints at low cost/risk).
  2. Foundational/shared work next.
  3. Per-area parity / feature work.
  4. Content/data/cleanup last.
  Each item: a stable ID, one-line what, the source gap ID, severity, and the verify method. Tag the current phase
  **NOW**.
- **`docs/plans/PRODUCTION-BACKLOG.md`** — anything deferred: low visible ROI, large+invisible refactors, blocked work,
  or out-of-scope. Say *why* it's deferred and what unblocks it. Re-evaluate, don't just dump.

## Rules
- If an item turns out 10× bigger or mostly-invisible than peers, **flag it and right-size it** (split, or backlog the
  heavy part) — surface the tradeoff, recommend, let the user decide rather than silently grinding.
- Each roadmap item carries the **definition of done** (reference match + the real thing working per the project's
  profile, user-confirmed) — never "spec green."
- Supersede stale "all done" claims explicitly; keep old status as history, don't let it mislead.

## Then
Hand the **NOW** phase to `/skill:gate-build-goodbehavior`.
