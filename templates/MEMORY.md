# Memory index

One line per durable learning, loaded each session. One fact per file (see `/learn-goodbehavior` for the per-file schema). Seed the
two behavioral non-negotiables below on init; add `gotcha`/`project`/`reference` entries as they're discovered.

- [Project profile](project-profile.md) — what "the real thing / verify / evidence" mean for THIS project (its type); read before verifying
- [Definition of done](definition-of-done.md) — done = real thing working + evidence + user-confirmed; no single proxy; never self-declare
- [Reporting honesty](reporting-honesty.md) — claim only what you can show; surface failures/blockers; state partial/deferred plainly
- [Build/deploy gotchas](build-deploy-gotchas.md) — project-specific traps (caching, drift, bundled-vs-runtime config, seeded access…); check BEFORE diagnosing

<!-- Seed files to create alongside this index:

project-profile.md   (written by /adopt-goodbehavior from the resolved profile; fill the three slots for THIS project)
---
name: project-profile
description: What "the real thing / verify / evidence" mean for this project's type — read before verifying
metadata: { type: project }
---
Profile: <development | analysis | research | creative | composed | custom>. Slots may come from different profiles.
- **the-real-thing:** <e.g. the running app; the output dataset on real input; the source-backed findings; the delivered deck>
- **verify:** <how a consumer exercises it — drive the flow / re-run + validate / re-check claims vs sources / walk + fact-check>
- **evidence:** <what proof looks like — screenshot/response / validation output / citation ledger / artifact walkthrough>
See `.omp/goodbehavior/profiles/` for the full profile body. **Why:** "done" is only concrete once these are pinned.

definition-of-done.md   (a POINTER, not a restatement — the canonical wording lives in the principles home
                         (AGENTS.md "The one rule") and the concrete slots in [[project-profile]]; restating it
                         here creates a second copy that drifts)
---
name: definition-of-done
description: What "done" means here — the binding bar for completion
metadata: { type: feedback }
---
Done = real thing working per [[project-profile]] + shown evidence + user confirmation; never self-declare. Canonical
wording: the principles home (AGENTS.md, "The one rule"). **Why:** the recurring failure is collapsing a whole task to
one cheatable proxy.

reporting-honesty.md   (same pattern: essence + pointer to the principles' "Honesty under pressure")
---
name: reporting-honesty
description: How to report status honestly
metadata: { type: feedback }
---
Claim only what you can show; surface real failures; mark partial/deferred plainly; tag ✔ observed vs ⚠ relayed.
Canonical wording: the principles home (AGENTS.md, "Honesty under pressure"). **Why:** false/lazy claims hide the real
work left and cost more than the honesty would have.

build-deploy-gotchas.md  (start empty; fill via /learn-goodbehavior as traps are found)
-->
