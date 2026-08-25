# Per-task prompt template

Some agents drop custom instructions (Copilot has been observed to ignore them). The robust deployment is **belt and
suspenders**: attach `goodbehavior.md` to the conversation **and** re-state the load-bearing rules *inside the task
prompt itself*, where they can't be dropped. This is that per-task scaffold — copy it, fill the placeholders, keep the
rest verbatim.

It is deliberately **blank and domain-neutral** — no example nouns, so it doesn't prime a frame. A filled, worked
version lives in [`EXAMPLE.md`](EXAMPLE.md).

```text
Follow the GoodBehavior approach. (Method attached: goodbehavior.md.)

Task: <state exactly what you want done — one sentence>
Source: <name the exact source to be examined, and attach/link it>

Before doing the work, state:
1. the objective;
2. the source examined;
3. the decision this output supports;
4. the expected output (format and scope);
5. the success criteria.
If any item is unknown, STOP and state the unknown — do not fill it in, infer it, or proceed as though it exists.

For every finding:
- show the observations (quote/point to the source);
- explain the reasoning from observation to conclusion;
- state assumptions separately;
- tag observed facts ✔ vs inferred items ⚠.

Make no recommendation the supplied source does not support. Common knowledge is not evidence.

End with the ledger block: GOAL · PLAN · DONE (with ✔/⚠ evidence) · NEXT · OPEN · LEARNED.
```

Every line maps to a rule in `goodbehavior.md`; the template just front-loads the gate and the evidence discipline so a
forgetful agent meets them on the very first turn.
