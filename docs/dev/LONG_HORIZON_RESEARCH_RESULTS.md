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


## 30-year commercial policy reproduction (PR #36)

Unlike the no-product policies above, `tests/long-horizon-commercial.test.ts` starts at the ordinary ¥1 billion seed capital with research/engineering/marketing employees, pays for CPU research and manufacturing, launches a 2000-era CPU, operates its retail line with an explicit marketing budget, buys office level 2 and recruits two additional research employees in year 6, and designs refreshed CPUs when affordable. It buys valid CPU branch stages at their actual RP prices once per year. All outcomes come from the unchanged production `command` game simulation, with **no additional cash or RP grants**.

GitHub Actions successful game job on commit `ecfe864b4b2e0af29b5125119e66472931b94bb4` reported:

| Game year | CPU research-equivalent year | Cash (JPY) | Lifetime units sold across CPU models | Rival max research stage | Office level | RP remaining |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 2010 | 2018.58 | ¥1,772,922,095 | 111,540 | 5 | 2 | 5,903 |
| 2020 | 2029.14 | ¥1,670,594,435 | 168,650 | 10 | 2 | 6,530 |
| 2030 | 2036.67 | ¥1,171,379,383 | 175,547 | 15 | 2 | 5,857 |

- Total incremental purchased research cost: **118,352 RP**. Four CPU products were attempted/created over the horizon. The normal-difficulty firm survived all 30 years.
- Lifetime product sales, finance revenue and company cash are *simulated game economy* values; 175,547 units are not real-world market share and the 2010/2020/2030 technology years are research-progress equivalents, not real release dates.
- Sales flatten in the late 20-year window while cash trends downward, so one successful 30-year seed is **not evidence** that indefinite growth or a 100-year financed player strategy is viable.
- A single policy/seed cannot establish acceptable tuning for all play styles; follow up with 50/100-year commercially funded policies, multiple difficulty/mode/seed combinations, recurrent upgrades, advanced graphics/AI strategy and sensitivity across CPU/GPU/RAM.

**Decision:** Preserve existing RP cost and market speed on this evidence alone. With 3 research employees and legal CPU investments, technology is ahead of the industry's calendar-equivalent average, but the economy has slower late-game sales; tune with further reproducible data, never with calendar release-year research locks.

## Re-measurement after per-specification research (economy version 4)

Same seeds and policies, with each annual policy buying the cheapest available stage among all CPU branches (`researchBranches('cpu')`: foundation, cores, clock, IPC, process, L1/L2/L3, SMT, memory channels, cooling). Local `vitest` run on the PR branch.

| Policy | Game year | CPU research-equivalent year | Version 3 value |
| --- | ---: | ---: | ---: |
| No products, 1 researcher | 2030 | 2029.1 (133 stages, 70,971 RP) | 2028.6 |
| No products, 3 researchers | 2030 | 2038.0 (173 stages, 125,110 RP) | 2037.7 |
| Commercial | 2010 / 2020 / 2030 | 2019.3 / 2029.8 / 2037.1 | 2018.6 / 2029.1 / 2036.7 |

- Research pace is unchanged within one year: per-category cost weights keep the total price of a category's research comparable even though it is split into more branches.
- Commercial cash was ¥2.05B / ¥2.09B / ¥1.59B (version 3: ¥1.77B / ¥1.67B / ¥1.17B) with 198,650 lifetime units (175,547). Frontier refreshes cost more than before. *(Corrected in version 5: this run attributed the higher cash to old designs getting cheaper to make, but manufacturing charges the unit cost fixed at design time; an old model's cost does not fall. See #44 below.)*
- The one-purchase-per-year smoke test now reaches 2006 (2030) and 2022 (2100); it is a lower-effort baseline and still not evidence about RP balance.

## Two centuries to year 2200 (economy version 5)

`tests/long-horizon-2200.test.ts` (opt-in: `PCT_LONG_HORIZON=1 npx vitest run tests/long-horizon-2200.test.ts`, about three minutes) runs 200 game years on normal difficulty for seeds 3, 11 and 47 with real commands only. Each year the firm buys the cheapest available CPU research stage while its RP lasts; every four years it designs the best CPU that fits its cooler and the strongest socket it can use (industry sockets by calendar year), launches it and discontinues the previous model. Two policies:

- **Five-person company:** research, engineering and marketing hires, office level 2 and two more researchers in year 6, nothing else.
- **Growing company:** the same, then one office level every four years and two researchers a year, each only while ten years of the added running cost plus ¥1B stay in the bank (reaches office 10 with 40 staff by 2050).

Seed 47 (the other seeds differ by less than 0.3% in every column):

| Policy | Game year | CPU tech-equivalent year | Cash | Lifetime units | Rival max level |
| --- | ---: | ---: | ---: | ---: | ---: |
| Five-person | 2050 | 2048.0 | ¥118B | 2,491,789 | 25 |
| Five-person | 2100 | 2067.3 | ¥203B | 3,617,850 | 50 |
| Five-person | 2150 | 2081.8 | ¥216B | 3,711,980 | 75 |
| Five-person | 2200 | 2093.6 | ¥219B | 3,756,659 | 99 |
| Growing | 2050 | 2129.6 | ¥123B | 2,550,791 | 25 |
| Growing | 2100 | 2200 (all CPU research done) | ¥332B | 5,203,048 | 50 |
| Growing | 2150 | 2200 | ¥690B | 7,903,048 | 75 |
| Growing | 2200 | 2200 | ¥1.32T | 10,573,289 | 99 |

- Both policies stay solvent for 200 years with no debt, and every refresh design is accepted (no socket, cooling or price rejection).
- A five-person company keeps pace until about 2050, then falls behind the calendar market (−33 years in 2100, −106 years in 2200) and its sales fade to under 2,000 units a year after 2100 (about 900 a year after 2150). The research cost curve outgrows a fixed RP income; the player has to grow the research team to stay current. This matches the design intent but is now measured.
- A growing company is about 80 years ahead of the market in 2050 and finishes every CPU research stage around game year 2095. From then on its RP accumulates unused (6.9M RP by 2200) and its lead shrinks as the market catches up to 2200. Large research teams therefore exhaust the extended tier a century before the calendar does; recorded as a follow-up balance issue rather than tuned here.
- Rivals reach level 99 (year-2200 technology) exactly in 2200, as `rivalShare` intends.

These are two scripted policies, not human play. They do not cover GPU/PC/AI-focused companies, hard mode or socket development strategies.

## Old models do not get cheaper (#44)

`tests/sales-stats.test.ts` checks that a product's unit cost stays at its design-time value while research advances, and that refreshing the CPU every four years beats keeping the first model. Scratch runs of the same two policies (seeds 3/11/47): after 30 years, keeping the first CPU ended with about ¥1.20B and 53k units, refreshing with about ¥12.24B and 772k units; after 50 years ¥0.80B against ¥11.35B. The first model's unit cost was ¥18,900 at design and still ¥18,900 at the end. An old model's margin does not grow; it loses demand as the market moves on, so no cost-model change was made.

