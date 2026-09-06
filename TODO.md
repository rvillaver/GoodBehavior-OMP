# GoodBehavior — TODO

Open work on the bundle itself. Keep everything here **generic** — GoodBehavior is a portable method, not a record of any
one project. Project-specific instances are where these lessons are *learned*; this file is where the **generic** form
gets baked back into the loop.

## The mechanism this file serves: local learnings → baked into the loop

GoodBehavior should improve by **promoting locally-learned good practices into its generic principles.** A project hits a
trap, `learn-goodbehavior` records it as a project memory, and when that lesson is really a *general* discipline (not a
project fact), its generic form is distilled into `.omp/AGENTS.md` / the relevant skill — so every future adoption inherits it.
The self-update model (`update-goodbehavior`, 3-way merge) is the carrier: a principle improved in one project's copy can
flow upstream and back out to others.

- [x] **Build the promotion path.** Extend `learn-goodbehavior` (or add a step) to distinguish a *project fact* (stays
      in project memory) from a *general discipline* (gets a generic rewrite proposed into `.omp/AGENTS.md`/a skill). Ask
      before editing principles; never auto-rewrite the persona.
- [x] Decide how a project-local principle improvement travels back to the source repo (PR? a "contribute-up" note in
      `update-goodbehavior`?), so good practice isn't trapped in one copy.

## Promoted into the loop (log)

- **2026-07-08 — generalize beyond dev + shrink the trust surface** (from three non-dev adoption attempts — a
  presentation, a research project, data processing — where adopt balked with "not meant for this"). (1) **Profiles**:
  the discipline is invariant; only *the-real-thing / verify / evidence* change by project type (truth source). Four
  composable cores (development · analysis · research · creative) + custom fallback; adopt now **elicits intent before
  surveying files** and must never decline a project. (2) **Behavioral done-gate**: verification vocabulary is honored
  only if something was actually run/observed after the last file change that turn — proof-words alone no longer pass.
  (3) **Deterministic mechanics**: install/update mechanics moved to `scripts/`; skills keep the judgment. (4)
  **Self-test**: `tests/run_all.py` — the bundle held to its own standard (hook behavior, install round-trip, update
  merge paths, drift lint).
- **2026-06-28 — four promotions distilled from an adopter survey** (a real project running the bundle; identity stripped,
  generic form only). (1) **Standing-proceed** — an earned escalation of trust: once the user has seen the gates hold,
  the loop may run a plan unattended, pausing only for a genuine design decision / real failure / irreversible step; it
  removes the pause *between* items, never a guardrail. Baked into `.omp/AGENTS.md` (new "Standing-proceed" section + "Don't
  sidetrack") and `gate-build-`. (2) **Verified-vs-unverified labeling** — tag claims/findings `✔` firsthand vs `⚠`
  relayed; never let a `⚠` drive a build; re-read load-bearing state. Baked into `.omp/AGENTS.md` "Honesty under pressure" +
  `audit-`/`gate-build-`. (3) **Adversarial, multi-lens audit** — run independent lenses (security / coverage-vs-journeys
  / completeness-wiring / flow-UX / coherence) and surface contradictions; into `audit-`. (4) **UAT plan** — a living
  manual user-test map (feature set → how to test → pass/fail close-out); new `uatplan-goodbehavior` skill +
  `templates/UAT-PLAN.md`, wired into `verify-`/`gate-build-`/`audit-`.
- **2026-06-23 — adopt: separate run-locally from deploy-trigger and verify-target.** Surfaced while adopting a real
  push-to-deploy project (a managed host watching a branch + a managed backend): adopt had recorded the *local* run
  commands as "the dev approach" and missed that deploy was push-to-branch (host + CI auto-deploy) and that **verify runs
  against the deployed URL, not localhost** — and that a build-only pipeline catches no logic bugs. Baked generically into
  `adopt-goodbehavior` Phase 1 (probe deploy/hosting config; analyze three facets) + Phase 2 (confirm the three facets
  separately; flag push=deploy; capture the verify URL).

## Coverage gap: "report verified state, not intentions" (generic)

The bundle covers *basic* honesty (claim only what you can show; observe real behavior, not a green test; confirm you're
on the current build; don't carry an unverified item forward). The sharper sub-points below were **promoted 2026-06-28**
into `.omp/AGENTS.md` "Honesty under pressure" + "Standing-proceed" and reinforced in `audit-`/`gate-build-`/`verify-` (see the
promotion log above):

- [x] **Relayed findings are claims, not facts.** A result from a sub-agent, an audit, a search, or a prior summary is
      *to-verify*, not established truth — don't act on it as fact until observed firsthand. *(→ Honesty under pressure +
      `audit-` ✔/⚠ tags.)*
- [x] **Re-read load-bearing facts; don't trust recollection.** State that drives a decision — file contents (especially
      after edits), versions, identifiers, environment/build state — must be re-read from source, not recalled. *Why:*
      long sessions and context compaction summarize away the raw observations; durable docs preserve **decisions, not
      current state**, so current state is recovered by re-reading, not remembering. *(→ Honesty under pressure.)*
- [x] **Name the cost, so the discipline lands.** The expensive waste isn't a long session — it's the span between a
      hollow "done/verified" and the moment the gap surfaces, plus the rework to unwind everything built on it. *(→
      Honesty under pressure, stated as the rationale.)*
- [x] **Verified-vs-unverified labeling as the core move.** Explicitly mark unverified work as unverified; "wrote/changed
      it" is a different claim from "ran it and observed the result." *(→ Honesty under pressure + the `✔`/`⚠` convention
      across `audit-`/`gate-build-`.)*
- [x] **Length is not itself a reason to hesitate or checkpoint.** With recovery docs + re-verify discipline in place, a
      long run is fine — keep executing; don't stop-the-world or ask "should I continue?" as a reflex. *(→ "Standing-
      proceed" in `.omp/AGENTS.md` + `gate-build-`.)*

## Carried-over open items (install/update thread, done 2026-06-23 — these remain)

- [x] **Initial commit of the source repo.** Done — the repo has been committed since 2026-06 (this item had gone
      stale; superseding it explicitly per the method's own rule).
- [x] **Exercise the round-trip.** Proven hermetically by `tests/test_update.py` (fast-forward / clean merge /
      conflict-with-markers / upstream-removal, against a real second commit, via `scripts/update.py`). A live
      cross-project round-trip on a real adoptee is still worth one run — folded into the trial item below.
- [x] **Live update round-trip on a real adoptee** — done 2026-07-08 against a real June install (base `f87ca80` →
      `bf9e9d3`, across the profile-layer + scripts rewrite): all 8 tracked files reconciled (7 fast-forwards, 1
      unchanged, zero conflicts — the adoptee had no local adaptations, so the merge/conflict paths remain covered by
      `tests/test_update.py`), manifest advanced, upstream additions (uatplan skill + development profile) added via
      `install.py` with judgment (their existing QA catalog kept — no template imposed), `project-profile` memory
      written in the adoptee's own memory format.
- [x] **Adopt trial on a real NON-DEV project** — done 2026-07-08 on a real workshop/presentation project (identity
      stripped). The flow held: intent elicited BEFORE any file survey; the user's three answers resolved cleanly to
      the **creative** profile (no composition, no fallback needed); the survey corroborated (deck toolchain + a video
      render pipeline + an unrelated parked payload correctly excluded); install ran through `scripts/install.py`
      (7 skills, ONLY the creative profile, hook wired, zero warnings); judgment steps tailored the principles, seeded
      a real render/export gotcha from the project's own docs, and adapted the memory index — a live example of a
      locally-adapted tracked file for a future update to 3-way-merge. Mid-adoption, an upward-infection audit was
      requested and run: identity grep clean; two de-prescription fixes promoted (generic deploy example;
      defaults-not-prescriptions notes) + a machine-local-path lint guard.
