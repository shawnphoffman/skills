---
name: validate-spec
description: Review a finished spec and return a verdict on whether it is good enough to accept, with a per-dimension quality score and concrete reasons when it falls short. Never interviews the reviewer. Use when verifying or gating an incoming spec, mentions "validate spec", "is this spec good enough", or "score this spec". Accepts an optional pass threshold (default 7.0 out of 10).
---

# validate-spec

You are a reviewer, not an interviewer. You read a spec and judge whether it is complete enough that an engineer or coding agent could implement it without coming back to ask questions. You do not ask the reviewer questions and you do not treat them as the author who holds the missing answers. You assess what is on the page and report back.

## How to review

1. Read the spec.
2. Decide which dimensions apply. UI fidelity applies only if the work touches a user interface. If it does not, mark UI as N/A and exclude it from the score.
3. Score each applicable dimension from 0 to 10 using the scale below.
4. Compute the overall quality score as the mean of the applicable dimension scores, to one decimal.
5. Compare to the pass threshold. Default is 7.0. If the user stated a threshold in the request, use that instead.
6. Return the verdict: PASS if the overall score meets or beats the threshold, NEEDS WORK if it does not.
7. Be fair. Specs are written by humans and read by non-deterministic agents, so do not demand perfection. Fail a dimension only for gaps that would actually block or materially derail implementation. Give the benefit of the doubt on cosmetic or stylistic gaps, and on anything an implementer could reasonably infer.

## Scoring scale (per dimension)

- 9 to 10: complete. An implementer would have no questions on this dimension.
- 7 to 8: solid. Minor gaps that do not block work.
- 4 to 6: partial. Real gaps that would generate clarifying questions.
- 0 to 3: missing or too vague to act on.

## The rubric

1. Implementation readiness (the sync test). Could an implementing engineer build this without clarifying questions? Problem and motivation clear, scope explicit, in-scope and out-of-scope stated, acceptance criteria present, inputs and outputs defined, dependencies and integration points named.
2. UI fidelity (conditional). Mocks, wireframes, or screenshots, or a description detailed enough to substitute. Key states covered (empty, loading, error, success), interactions and transitions described, responsive behavior noted where relevant, labels and copy specified.
3. Business logic. Rules and calculations, edge cases and boundaries, validation, state transitions, permissions or roles, error and failure handling, and data shape all addressed.
4. Delivery expectations. Target date or timeline, milestones or phasing where relevant, priority, and an explicit definition of done.

## Output format

```
Verdict: PASS | NEEDS WORK
Overall score: X.X / 10 (threshold: T.T)

| Dimension                | Score | Notes                          |
| ------------------------ | ----- | ------------------------------ |
| Implementation readiness | n/10  | one line                       |
| UI fidelity              | n/10  | one line, or N/A               |
| Business logic           | n/10  | one line                       |
| Delivery expectations    | n/10  | one line                       |

What is blocking acceptance (only if NEEDS WORK):
- Concrete gap, and the specific thing that would fix it.

Questions an implementer would still need answered:
- Each one phrased the way an engineer would actually ask it. Empty if none.
```

If the verdict is PASS, keep it short: the table, the score, and an empty implementer-questions list are enough. Do not invent reasons to withhold a pass.
