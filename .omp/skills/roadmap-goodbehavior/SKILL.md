---
name: roadmap-goodbehavior
description: Roll a gap register (or a pile of asks) into a sequenced, gated, phased plan. Use after audit-goodbehavior, or when work needs ordering before building.
---

**Loop position:** step 3 — after `/skill:audit-goodbehavior` (or straight from a reference/design when nothing is built),
before `/skill:gate-build-goodbehavior`.

Turn gaps/asks into an ordered plan that the gated loop can execute. Be honest about size and value — don't let a
big-but-invisible item sit ahead of cheap high-visibility wins just because it was listed first.

> Paths below are **defaults, not prescriptions**. If adoption mapped planning onto an existing structure (a roadmap,
> handoff "next steps", an issue tracker — check .omp/AGENTS.md conventions / project memory), work THERE instead.

## Produce
- **`docs/plans/<INITIATIVE>.md`** — one file per initiative, named for the work (`CHAT-BRIDGE.md`,
  `SECURITY-PROFILES.md`), holding the plan for *that* initiative only. Group into **phases**, sequenced by leverage:
  1. **Systemic, cheap, high-visibility** first (the fixes that answer the loudest complaints at low cost/risk).
  2. Foundational/shared work next.
  3. Per-area parity / feature work.
  4. Content/data/cleanup last.
  Each item: a stable ID, one-line what, the source gap ID, severity, and the verify method. Tag the current phase
  **NOW**.
- **`docs/plans/ROADMAP.md`** — a **thin index of the initiatives that are still active**, one line each pointing at
  its file. Never the plans themselves: a single growing roadmap becomes mostly closed history, and then the file
  everyone opens first is the least current thing in the project. Drop an initiative's line when it closes.
- **`docs/plans/PRODUCTION-BACKLOG.md`** — anything deferred: low visible ROI, large+invisible refactors, blocked work,
  or out-of-scope. Say *why* it's deferred and what unblocks it. Re-evaluate, don't just dump.

## Rules
- If an item turns out 10× bigger or mostly-invisible than peers, **flag it and right-size it** (split, or backlog the
  heavy part) — surface the tradeoff, recommend, let the user decide rather than silently grinding.
- Each roadmap item carries the **definition of done** (reference match + the real thing working per the project's
  profile, user-confirmed) — never "spec green."
- Supersede stale "all done" claims explicitly; keep old status as history, don't let it mislead — **in the archive,
  not in the plan.** See "Close a phase" below: history is kept, not carried.

## Close a phase — the plan shrinks as work finishes
A phase that is done, verified and user-confirmed **stops being plan and becomes evidence.** Move it out in the same
change that closes it:

1. **Append it to the initiative's evidence file** — `docs/plans/archive/<date>-<initiative>-phaseN.md` (add the
   shipped version if there is one). Take the whole phase: its item table, its per-item verify evidence, its
   definition of done, the corrections and dead ends. That record is *more* useful intact than summarized.
2. **Leave one digest line in the plan**, under a `## Closed` heading: what the phase delivered, when, and a link to
   the evidence file. One line — not a collapsed table, not a struck-through copy.
3. **Never delete.** Archived phases stay readable and greppable; they lose their claim on the plan, not their
   existence. Someone will ask "why did we do it that way" and the answer must still be there.

A plan whose closed phases are one line each stays readable at phase 15 the way it was at phase 2. A plan carrying
every closed phase inline is the single most common way these documents rot — **if you open a plan and most of it is
finished work, fixing that is the first item, not a chore for later.**

If you can't tell whether a phase is really closed (evidence thin, user never confirmed), **leave it in the plan.**
Never archive something you can't show is done — that is how work silently disappears.

## A status line is a claim — date it, and re-check it before repeating it

A plan's status is the most-read and least-verified line in the whole corpus. It is written once, when the work is
fresh, and then quietly goes out of date as the code moves on. Nobody re-reads it against reality, because it reads
like a fact.

On 2026-09-05 an audit of one project's 12 plans found **6 wrong at once**: three claimed work was unfinished that
was already built and running, one had no status line while three of its items were complete, one said "nothing
built" next to a 239-line installer, and one claimed a release (`1.2.104`) that has no tag and no GitHub release.
The cost was not hypothetical — one of them was relayed to the user in a "what's next" survey, and they chose what
to work on based on it.

**Therefore:**

- **Every status line carries the date it was last checked against the code**, and names the artefact that backs it
  — a file, an export, a command's output. `_Checked against the code YYYY-MM-DD: src/x.ts exists, `<verify command>`
  prints `<observed result>`._` A date with no artefact is just a newer-looking claim.
- **Before quoting a plan's status** — in a summary, a survey, a "what's next", anywhere a human will act on it —
  **re-check it against the code.** Reading the header is not checking. If you are about to tell someone an
  initiative is unbuilt, look for its files first.
- **Never carry a status forward untouched** when you edit a plan for any other reason. If you cannot confirm it in
  that moment, say so in the line itself rather than leaving a stale claim standing.
- **Build state and verify state are different claims.** "Nothing built" and "never verified on the target machine"
  are not the same sentence; conflating them hides finished work.
- **A release claim needs a tag and a published release**, not a version number someone wrote down. Check.

## Then
Hand the **NOW** phase to `/skill:gate-build-goodbehavior`.
