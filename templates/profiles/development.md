---
name: development
use-when: the output is RUNNING SOFTWARE checked against runtime behavior — web app, CLI, service, library, a pipeline's build
truth-source: code execution / runtime
---

- **consumer:** a person (or caller) operating the running software.
- **the-real-thing:** the software actually running — the real interface *and* the backend/logic it drives, on the
  current build (not a stale cache, not the diff, not a green test).
- **verify:** drive the actual flow end to end the way a user/caller would — navigate, input, submit, call the real
  endpoint — through the interface and the backend it hits. A passing unit test is necessary, never sufficient.
- **evidence:** observed runtime behavior — a screenshot/recording of the result (ideally beside the reference), or the
  real response/state change proving the flow fired (record created, count changed, state advanced).
- **verify anti-patterns:** "tests pass" / "build succeeded"; "I changed the code so it should work"; a screenshot of a
  cached/old build; narrating expected behavior without running it.

> This is the profile the base method was originally written in. Its dev-workflow facets — local dev loop, deploy
> trigger, and what "verify live" runs against (deployed URL vs localhost) — are confirmed during adoption.
