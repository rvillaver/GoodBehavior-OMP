# Roadmap — active initiatives

Thin index of initiative plans that are still active. One line per live initiative; closed initiatives leave this file.
Done work moves to `docs/plans/archive/`; deferred work lives in [PRODUCTION-BACKLOG.md](PRODUCTION-BACKLOG.md). Every
item runs the gated loop (build → verify live → record learnings → gate) and is held to the real definition of done
(reference match + working flow, **user-confirmed** — never "spec green").

Sorted by leverage: systemic/cheap/high-visibility first, then foundational, then per-area, then content/data.

## Active
- [ ] [<INITIATIVE>](<INITIATIVE>.md) — NOW: <phase>; checked YYYY-MM-DD against <artifact/command>

## Initiative file pattern

Each initiative gets its own `docs/plans/<INITIATIVE>.md`:

```md
# <Initiative>

_Status checked YYYY-MM-DD against <artifact/command>: <current build/verify state>._

## NOW — Phase N
- [ ] **R1** — <one-line what> · (gap <id>) · P0 · verify: <how you'll prove it live>

## NEXT
- [ ] **R2** — <what> · P1 · verify: <how>

## LATER

## Closed
- YYYY-MM-DD — Phase N delivered <digest>; evidence: [archive/<date>-<initiative>-phaseN.md](archive/<date>-<initiative>-phaseN.md)
```

A phase that is done, verified, and user-confirmed stops being plan and becomes evidence: append the whole phase and
its verification record to `docs/plans/archive/`, then leave one digest line behind. If you cannot show it is closed,
leave it live.
