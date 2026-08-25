---
name: analysis
use-when: the output is a CONCLUSION or DATASET checked against DATA — reports, models, data pipelines' output, evaluations
truth-source: data
---

- **consumer:** a decision-maker who will act on the numbers.
- **the-real-thing:** the output artifact — dataset, table, figure, metric, model — produced from **real (or
  representative) input**, not a toy sample.
- **verify:** re-run on real input and validate *correctness*, not just completion — schema/shape, row/record counts,
  spot-checks against a known-good, edge and null/empty cases, and whether the conclusion actually follows from the
  numbers. "The script exited 0" is not verification.
- **evidence:** the validation output itself — counts, diffs, reconciliations, checks passing on real data — plus the
  reasoning from numbers to conclusion. Not a screenshot of the code that produced it.
- **verify anti-patterns:** ran on sample/mock data and called it done; reported a number without reconciling it;
  "the pipeline ran" with no correctness check on the output.
