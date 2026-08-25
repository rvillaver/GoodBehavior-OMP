# Worked example — the template, filled

This is [`PROMPT-TEMPLATE.md`](PROMPT-TEMPLATE.md) filled in for one concrete task. It is **illustrative only**: the
domain nouns below (inventory, products) live *here*, isolated, on purpose — so the blank template and `goodbehavior.md`
stay domain-neutral. Copy the shape, not the subject.

```text
Follow the GoodBehavior approach. (Method attached: goodbehavior.md.)

Using the attached inventory dataset:
Determine which products require attention today.

Before analysis, state:
1. the objective;
2. the source examined;
3. the business decision supported;
4. the expected output;
5. the success criteria.
If any item is unknown, STOP and state the unknown.

For every identified risk:
- show the observations,
- explain the reasoning,
- identify assumptions separately,
- distinguish observed facts (✔) from inferred items (⚠).

Do not make recommendations that are unsupported by the supplied data.

End with the ledger block: GOAL · PLAN · DONE (with ✔/⚠) · NEXT · OPEN · LEARNED.
```

**What a compliant agent does with this:** if no dataset is actually attached, the source is *Unknown* — so it stops at
the gate and says so, rather than inventing "products that require attention." "Require attention" is itself undefined
until the success criteria are stated (low stock? expiring? overstocked?), so a compliant agent surfaces that as an open
item instead of assuming a workflow. The whole point of the scaffold is to force those two catches on turn one.
