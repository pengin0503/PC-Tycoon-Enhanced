# Long-horizon research policy measurements — 2026-10-09

Source: deterministic CI run in PR #35, `tests/long-horizon-balance.test.ts`; game uses 360 days/year.
Research is **not** gated by real-world release dates. Hardware invention is constrained by RP, research prerequisites, staffing and research-unlocked design ranges.

## Thirty-year resource comparison

Scenario begins in 2000, normal difficulty, regular startup capital (¥1,000,000,000), no product launches, 1 or 3 research staff of skill 60. Each annual policy buys the cheapest available CPU compute/capacity/power/compatibility research stage that has its prerequisites and that the firm can afford. Staff are paid normally and the garage rent is incurred.

| Researchers | Game year | CPU research tech-equivalent year | Lead relative to market | RP spent | Remaining RP | Final cash | Completed CPU stages |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 2030 | 2028.6 | −1.4 yr | 70,382 | 3,734 | ¥746,200,000 | 58 |
| 3 | 2030 | 2037.7 | +7.7 yr | 125,200 | 4,428 | ¥382,600,000 | 76 |

These are observations for two policies, **not** normative claims that 3 research staff always beats 1 economically, nor a forecast of player competitiveness with manufacturing/advertising/revenue. Staff employability, money, prerequisite order, 10/50-year gaps and family differences require more coverage. Technology-equivalent years summarize research progress, not actual inventions.

## One-hundred-year smoke test

A separate deterministic scenario begins with ¥1 trillion, hires one skill-50 researcher and deliberately purchases **at most one CPU compute research per year**. It reaches game-year 2030 at tech-equivalent 2013.3 with RP 2,797, and game-year 2100 at tech-equivalent 2023.5 with RP 9,512. This is a lower-effort synthetic baseline; the technological gap here is caused mainly by the **one purchase per year** policy and cannot be used as evidence of an RP economy failure.

## Interpretation and future work (#25)

- Under the observed 30-year normal scenario, the RP economy permits a small team to keep roughly pace with the market and a larger research team to innovate significantly ahead. Do not rebalance point costs solely from the unrealistic 100-year one-purchase case.
- Repeat experiments with manufacturing, sales cash flow, office upgrades, difficulty modes, multiple hardware categories and higher-year R&D to evaluate sustainable late-game strategy.
- If future tuning is justified, keep physical performance and price balancing separate from calendar research prohibition; tests should assert RP/prerequisite invariants.
