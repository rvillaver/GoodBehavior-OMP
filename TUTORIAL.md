# Tutorial — how to use GoodBehavior

A practical walkthrough: install the method into a project (new or existing), turn intent into a **plan + checklists**,
then **build it down** under the gated loop until the real thing works — with evidence, user-confirmed.

If you haven't, skim the [README](README.md) for what GoodBehavior *is*. This doc is how you *drive* it.

---

## First, the thing you're worried about: it won't infect your project

Adopting GoodBehavior brings **tools and principles** into your repo — not GoodBehavior's identity. Here's exactly what
crosses the line and what never does:

| Lands in your project (yours now) | Stays in GoodBehavior (never copied) |
|---|---|
| `.omp/skills/*-goodbehavior/` — the working skills (adopt itself stays behind: it's a run-once installer) | This `TUTORIAL.md`, the `README.md`, `scripts/`, `tests/` |
| `.omp/extensions/done-gate.ts` — auto-discovered by OMP on startup (no settings file, no Python) | GoodBehavior's own `TODO.md` (its dev backlog) |
| The **principles** merged into *your* `AGENTS.md` (or linked from your existing doc), with hard requirements in a sticky `.omp/RULES.md` | GoodBehavior's self-dev `docs/` (gitignored anyway) |
| Plan/memory **scaffolding** from `templates/` — which become *your* `ROADMAP.md`, `MEMORY.md`, etc. | The GoodBehavior git history / source repo |
| A `manifest.json` recording where the copy came from (so updates can 3-way-merge) | |

So the only trace of "GoodBehavior" in your repo is the skill **filenames** (`*-goodbehavior`) and the manifest pointer.
Your roadmap, your audit, your learnings, your UAT plan are all about **your project** — written in your project's terms.
The method's meta-docs (this tutorial included) are never dragged along. Adopt **merges into** what you already have
(appends to an AGENTS.md, links from a HANDOFF.md, maps onto an existing roadmap) — it doesn't impose a parallel structure.

---

## One-time setup: get the bundle

Clone GoodBehavior and open an **OMP session inside it** so the skills load:

```bash
git clone <this-repo-url> GoodBehavior-OMP
cd GoodBehavior-OMP
omp               # open a session here; adopt-goodbehavior is now available as /skill:adopt-goodbehavior
```

You drive `adopt-goodbehavior` from *this* session and point it at your project. Every other skill
(`audit-`, `roadmap-`, `gate-build-`, …) you invoke later from a session opened **in your project**, because adopt
installs copies of the skills there.

---

## Step 1 — Adopt: install into a project

```
/skill:adopt-goodbehavior /path/to/your-project
```

Adopt runs five phases and **changes nothing until you confirm**: it *resolves* source + target, *understands your
intent and resolves a profile*, *analyzes* your project, *proposes* a tailored plan **with options**, and only then
*installs*.

**It's not dev-only — and it asks before assuming.** Adopt first asks *what your project is* (what "done" looks like,
who consumes the output, how you check it's right) and resolves a **profile** — development, analysis, research, or
creative — that defines what "the real thing / verify / evidence" mean for you. Profiles are composable (a data pipeline
is *built* like development but *verified* like analysis), and if none fits, adopt elicits those three slots from you
directly. It will never tell you "GoodBehavior isn't meant for this project."

**Existing project** — the common case. Adopt reads your stack, your workflow, and your existing context docs
(`AGENTS.md`, `HANDOFF.md`, `README`, `docs/`, any "read this first") and proposes how to integrate: append principles to
your AGENTS.md or link them from your handoff doc; map planning onto your existing roadmap/issues rather than forking it.

**New / empty project** — initialize the project first (at minimum `git init` and whatever skeleton your stack needs),
then adopt. With little to integrate, it scaffolds fresh: an `AGENTS.md` with the principles (plus a sticky
`.omp/RULES.md` carrying the definition of done across long sessions), and `ROADMAP.md` /
`PRODUCTION-BACKLOG.md` / `MEMORY.md` seeds you'll fill in.

**The one thing to get right when it asks (development slot): the dev approach.** When your profile includes a
development slot, adopt makes you confirm three *separate* things — don't let them collapse into one (for a pure
analysis/research/creative project this is skipped, and getting the **profile slots** right is the thing that matters):
- **(a) local dev loop** — how you build/run/test on a machine;
- **(b) deploy trigger** — how a change actually ships (a manual command? push-to-branch auto-deploy? which branch?);
- **(c) verify target** — what "verify live" runs *against* (a deployed URL vs localhost).

If deploy is push-triggered, adopt flags that **pushing = deploying** (needs your explicit go-ahead). Your answers get
recorded so later steps use the agreed method, not a guess.

> After adopt, **open a new session in your project** for everything below.

---

## Step 2 — Flesh out the plan

### 2a. Audit — find *all* the gaps (honestly)

```
/skill:audit-goodbehavior
```

Catalogs the concrete delta between what exists and what's wanted, **cross-checked against a reference** (a design, a
spec, a competitor, a demo) — element by element, grounded in the real code/screens you just looked at, not memory. It's
deliberately **gated in batches** (one area per pass, reviewed before the next) so you get depth, not a shallow
everything-at-once list. Each gap is severity-tagged (P0/P1/P2) and carries a **verification tag**: `✔` confirmed
firsthand vs `⚠` relayed/still-to-confirm. For anything important, it runs **multiple independent lenses**
(security · coverage vs intended journeys · completeness/wiring · flow/UX · coherence) and treats a contradiction between
two lenses as its own finding. Output lives under `docs/audit/`.

### 2b. Roadmap — order the work by leverage

```
/skill:roadmap-goodbehavior
```

Rolls the gaps into a sequenced, **phased** plan in `docs/plans/ROADMAP.md` — systemic/cheap/high-visibility first, then
foundational, then per-area, then content. Low-ROI / blocked / out-of-scope work is parked (with *why* and *what unblocks
it*) in `docs/plans/PRODUCTION-BACKLOG.md`. The current phase is tagged **NOW**. Every item carries its definition of
done and how it'll be verified — never "spec green."

### 2c. UAT plan — the checklists (how each feature is tested)

```
/skill:uatplan-goodbehavior
```

Builds a **living manual user-test map** in `docs/qa/UAT-PLAN.md`: every feature set, the exact steps a human follows on
the **real thing** (per your profile — below shows the development case: the real app, UI *and* backend effect), the
expected result, and a `[ ] Pass / [ ] Fail` checkbox to close each one.
Organized by feature area (and by role, with a permutation matrix, where roles exist). This is the durable counterpart to
automated tests — it catches what unit tests can't — and it's what the build step verifies against. Keep it current as
features ship.

---

## Step 3 — Build, gated (plans + checklists → working software)

```
/skill:gate-build-goodbehavior
```

Works the **NOW** phase of the roadmap, **one item at a time**, to the real definition of done:

1. **Build** the smallest change that actually closes the gap (reuse before hand-rolling).
2. **Deploy/run** it your project's real way.
3. **Verify live** (`verify-goodbehavior`) — exercise the real thing the way its consumer would, per your profile (for a
   dev project: drive the flow through the real UI *and* backend like a user), and capture evidence. Mark the matching
   UAT case `[ ] Pass → ✔`. **A green test alone is not verification.**
4. **Record learnings** (`learn-goodbehavior`) — any non-obvious trap/correction/build-deploy fact, so it isn't
   relearned next session.
5. **Status** — mark the item done **only with evidence** (`✔`); otherwise "partial/blocked" (`⚠`) and log the blocker.

**Gate before the next phase:** loop the phase until *every* item has concrete evidence (or is explicitly backlogged).
A phase never advances on a `⚠` item. Don't sidetrack — log tangents to the backlog and keep the throughline.

### Standing-proceed — going faster once you trust it

After you've watched the gates hold — done means done, verification is real, reports are honest — you can grant
**standing-proceed**: tell the agent to run the plan **unattended**, without stopping to ask after every item. This is
*not* a shortcut past the checks: every item still builds → verifies live → records → gates exactly as before. It only
removes the *pause between items*. The loop pauses to ask **only** for a genuine design decision, a real failure, or a
destructive/irreversible step (a push that deploys, a migration). It's an earned escalation of trust — give it once you
have the confidence, take it back the moment you don't.

---

## Step 4 — Report honestly / what "done" means

The bar for done is high on purpose: **the real thing works end-to-end, with evidence, and *you* confirmed it.** Not a
passing spec, not a screenshot, not a confident summary. Until you've confirmed it, the honest status is **"not done
yet."** The `done-gate` extension (`.omp/extensions/done-gate.ts`, auto-discovered by OMP) blocks the stop with
feedback when a turn claims "done" without showing evidence — a heuristic backstop, not a lie detector. *You* are the
real done-gate.

---

## Step 5 — Stay current with the method

```
/skill:update-goodbehavior
```

Because your install is a **copy** (so you could adapt it), it won't auto-drift as GoodBehavior improves. `update` reads
your manifest, fetches the source, and for each tracked file does a **git 3-way merge** — untouched files fast-forward,
files you adapted get merged, genuine conflicts get markers for you to resolve. Your local adaptations survive; upstream
improvements flow in. Human-in-the-loop on conflicts.

---

## The whole loop at a glance

```
            ┌─────────────────────────── (once) ───────────────────────────┐
  adopt ───►│   audit   ──►   roadmap   ──►   uatplan                      │
            └───────────────────────────────┬──────────────────────────────┘
                                             ▼
                        ┌─────────  gate-build (NOW phase)  ─────────┐
                        │  build → verify (live) → learn → gate       │ ◄─ loop the
                        │  mark UAT case ✔ ; never advance on ⚠       │     phase
                        └──────────────────────┬──────────────────────┘
                                                ▼
                                   report honestly → you confirm → done
                                                 │
                                 (later)  update  ◄── pull method improvements
```

**Rules that hold the whole way through:** ground claims in what you just looked at (not memory); tag findings `✔`
verified vs `⚠` relayed and never build on a `⚠`; verify the real behavior, not a proxy; record learnings so you don't
relearn them; and never self-declare done.
