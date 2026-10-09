# Historical hardware references and research-based game balance

Updated 2026-10-09. **The player may research technology at any calendar date** once its prerequisites, RP cost and research staffing are satisfied. Historical launch dates are reference points for relative performance and the *simulated industry*, not research/purchase or design locks.

## Referenced hardware milestones

| Original year | Verified source/specification | Game-design interpretation |
| --- | --- | --- |
| 2000 | [Intel's launch list](https://www.intel.com/pressroom/kits/quickrefyr.htm) records the 1 GHz Pentium III release in March 2000. | Starting CPU defaults to 0.8 GHz, one core and 180 nm; 1.0 GHz is a plausible high-end reference |
| 2000 | [GeForce2 GTS contemporary coverage](https://pc.watch.impress.co.jp/docs/article/20000426/winhec05.htm) reports the 200 MHz GPU, 32–64 MB DDR RAM and 128-bit memory bus. | Starting GPU defaults to 0.2 GHz, 32 MB VRAM and 3 GB/s; different products have different widths/bandwidths |
| 2002 | [Intel's November 14 press release](https://www.intel.com/pressroom/archive/releases/2002/20021114comp.htm) documents the 3.06 GHz Pentium 4 with desktop HT. | SMT is an invention/research option, *not* a compulsory 2002 unlock |
| 2005 | [Intel's April 18 desktop dual-core launch](https://www.intel.com/pressroom/archive/releases/2005/20050418comp.htm). | Dual-core is a reference capability, *not* a compulsory 2005 unlock |
| 2017 | [Google's Transformer paper](https://research.google/pubs/attention-is-all-you-need/). | AI simulation is unlockable via research without waiting until 2017 |
| 2021 | [Samsung's DDR5 production release](https://news.samsung.com/us/samsung-14nm-euv-ddr5-dram-mass-production-most-advanced/). | DDR generation depends on compatibility research |
| 2025 | [AMD Ryzen 9 9950X3D specification](https://www.amd.com/en/support/downloads/drivers.html/processors/ryzen/ryzen-9000-series/amd-ryzen-9-9950x3d.html): 16 desktop cores, up to 5.7 GHz, 4 nm CPU chiplet, 170 W TDP. | A high-end *desktop* reference separate from workstation/server products |

These figures do **not** establish unique universal upper limits for all CPU/GPU/RAM/storage models. Not every year/category has been primary-source calibrated.

## Mechanics

1. **Player research:** no `earliestResearchYear` or release-year check. Research requires a research employee, completed prerequisites and sufficient RP; scaling RP costs and research tiers regulate how early a player can invent advanced technology.
2. **Player hardware:** `fieldRange` and `fieldOptions` depend on researched branches and their technology-equivalent progress, not on `state.day`. A saved product remains valid after changes to market conditions. A researched year-2000 company can exceed the real-world year-2000 product characteristics.
3. **Market and rivals:** `typicalSpec` uses time-progressive expectations, distinguishing approximate *typical retail* profiles from broad historic high-end envelopes. `historical-limits.ts` is used for the virtual market, never for restricting player invention. The 2000–2025 milestone table below remains a **stylized calibration envelope** with interpolated estimates.
4. **Performance:** CPU IPC-equivalent, GPU abstract computing units and in-game scores do not correspond to specific SPEC, PassMark or FLOPS benchmarks. Hardware designs trade CPU cores/clock/IPC, GPU VRAM/bandwidth/units, process size, power, cooling and price. A faster competing world reduces the appeal of older products.
5. **Beyond 2025:** The 2026–2100 trajectories are intentionally fictional. Technology-equivalent year is a progression indicator, not an assertion that an invention was released in that calendar year.

## Reference envelopes (not gameplay hard locks)

| Calendar year | Possible high-end CPU cores | Possible high-end CPU GHz | GPU VRAM GB | GPU bandwidth GB/s |
| --- | ---: | ---: | ---: | ---: |
| 2000 | 1 | 1.5 | 0.064 | 5.3 |
| 2002 | 1 | 3.1 | 0.128 | 11 |
| 2005 | 2 | 3.8 | 0.256 | 35 |
| 2008 | 4 | 4.0 | 1 | 120 |
| 2012 | 8 | 4.5 | 6 | 288 |
| 2017 | 16 | 5.0 | 12 | 484 |
| 2020 | 64 | 5.3 | 24 | 936 |
| 2025 | 192 | 6 | 32 | 1792 |

**Caveat:** These envelope entries are preliminary design estimates, **not** a source-backed exact universal maximum. In particular, the 2025 192-core envelope covers workstation/server-style categories rather than the 16-core enthusiast desktop segment. Separate `retailTypical` curves constrain the **simulated typical market**, not the player.

## Outstanding source and balance work (#33)

- Collect a source-backed launch/typical/high-end product table for CPU, GPU, RAM, storage, board, PSU and display at the milestone years.
- Verify power, memory throughput, prices and process technology together with release dates. Distinguish DDR/SDR generations and consumer/workstation/server categories.
- Calibrate performance *ratios* and manufacturing costs from real measurements; never equate an abstract game score with a published benchmark.
- Run #25 policy experiments to verify that research costs and production profitability can sustain early inventions without trivializing the late game.
