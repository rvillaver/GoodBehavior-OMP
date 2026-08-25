# Changelog

Every entry here is a unit a downstream project will 3-way-merge via `update-goodbehavior` — write entries so an
adopter skimming before an update knows what's coming and why.

## Unreleased — ported to OMP

The bundle now ships for OMP (`omp`) instead of Claude Code — a path/mechanism port; principles and skill content are
verbatim:
- **Layout:** skills now live at `.omp/skills/*-goodbehavior/`; the persona lives in `.omp/AGENTS.md`
  (was the Claude-style context file), with hard requirements split into a sticky `.omp/RULES.md` so the definition
  of done stays visible across long sessions; manifest at `.omp/goodbehavior/manifest.json`, profiles under
  `.omp/goodbehavior/profiles/`.
- **Enforcement:** the Python Stop hook + its settings wiring is replaced by a single TypeScript `session_stop`
  extension, `.omp/extensions/done-gate.ts`, auto-discovered by OMP on startup — no settings file, no executable bit,
  no Python required. Same lexical + behavioral checks, pushing back via stop-blocking feedback (the runtime caps
  consecutive continuations at 8; the gate itself fires at most 3 times per turn).
- **Installs:** always a project-local copy into the target's `.omp/` — never a symlink, never global.
- **Invocation:** skills are invoked as `/skill:<name>-goodbehavior` (or asked for by name) rather than slash
  commands; docs updated accordingly.

## 2026-07-13 — chat-agents: attach-file + inline-prompt deployment

Some assistants (Copilot observed) **ignore custom instructions**, so standing instructions alone aren't enough. The
`chat-agents/` folder now supports the robust belt-and-suspenders pattern and is single-sourced:
- `chat-agents/goodbehavior.md`: **the** method (attach it, or paste it as instructions) — one source of truth.
- `chat-agents/PROMPT-TEMPLATE.md`: a blank, domain-neutral per-task scaffold that re-states the gate + ✔/⚠ evidence
  rules *inside the task prompt*, where a forgetful agent can't drop them.
- `chat-agents/EXAMPLE.md`: the template filled for one task — domain nouns isolated here so the base stays neutral.
- `chat-agents/README.md`: documents both deployment modes; replaces `PERSONALIZATION.md` (removed — its block became
  `goodbehavior.md`, its usage notes became the README). Top-level README pointer updated.

## 2026-07-12 — chat-only companion

- `chat-agents/PERSONALIZATION.md`: a standalone copy-paste block that carries the operating principles into plain
  Claude.ai chat (no skills, no hook, no filesystem). Audited/enhanced from a user template — adds the gate-vs-drive
  throughline, ✔/⚠ evidence tagging, a done-is-not-self-declared gate, and the unknown-vs-brainstorm distinction; keeps
  the understanding gate and running ledger. All examples are domain-neutral (stated as schema, not instance) so the
  base doesn't prime a frame or infect future variants. Companion only — not installed, not part of the core method.
  README pointer added.

## 2026-07-08 — generalize beyond dev; shrink the trust surface

**Profiles — the method is no longer dev-only.**
- `templates/profiles/`: four composable core profiles (development · analysis · research · creative), each defining
  *the-real-thing / verify / evidence* for its truth source; an INDEX for cheap on-demand loading; a custom-elicit
  fallback. Only the matched profile(s) install into a target — never all four.
- `adopt-goodbehavior`: new intent-elicitation phase **before** the file survey (what is this project / what does done
  mean / who consumes it / how do you check it's right); the survey is corroboration, not the decider. Adopt must never
  say "GoodBehavior isn't meant for this project."
- Invariant layer reworded artifact-agnostic (AGENTS.md definition of done, verify/gate-build/audit/roadmap/uatplan
  skills, gate message, templates): "exercised the way its **consumer** would," with the dev phrasing moved into the
  development profile.

**Enforcement — the done-gate is now behavioral, not just lexical.**
- The done-gate hook: honest hedges always pass; verification vocabulary ("verified", "tests pass") is honored **only if
  something was actually run/observed after the last file change that turn**. "Edited files, ran nothing, said
  'verified'" now blocks. Doc-only turns exempt; bash-only turns pass; sub-agent results don't count as firsthand.

**Determinism — mechanics moved out of prompts into scripts.**
- `scripts/install.py`: adopt's mechanical half (copy, hash, wire the done-gate without clobbering existing config, write
  the manifest). Idempotent; never clobbers.
- `scripts/update.py`: update's mechanical half (manifest-driven git 3-way merge; fast-forward / merge / conflict /
  keep-upstream-removed; exit 2 on conflicts).
- The skills keep the judgment (profile resolution, proposals, conflict walkthroughs) and call the scripts.

**Self-test — the bundle held to its own standard.**
- `tests/run_all.py`: hook behavior (14 cases incl. the hollow-proof cheat), install round-trip + idempotency, update's
  four merge paths against a real second commit, structural + drift lint (profiles well-formed; invariant files must not
  re-acquire unscoped dev-coded phrasing). One command; green before shipping.

**Housekeeping.**
- `adopt-goodbehavior` is no longer copied into targets (run-once installer; targets carry the working skills +
  `update-goodbehavior`). Seeded memories point at the canonical principles instead of restating them. Stale TODO
  items superseded explicitly.

## 2026-06-28 — promotions from a real adopter

Standing-proceed; ✔/⚠ verified-vs-relayed tagging; adversarial multi-lens audit; `uatplan-goodbehavior` + UAT template.

## 2026-06-23 — adopt learns deploy ≠ run-locally ≠ verify-target

Adopt analyzes and confirms the three dev-workflow facets separately; flags push-to-branch = deploy; captures the
verify URL.
