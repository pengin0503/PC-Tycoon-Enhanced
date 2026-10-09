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


## 2026-10-09: verified manufacturer/product anchors and in-game metric mapping (#33)

These are **individual available-by-year samples**, NOT all-year release claims, worldwide medians, or caps on what the player can invent. The independent machine-readable list is `packages/content/src/hardware-evidence.ts`, covered by `tests/hardware-source-anchors.test.ts`.

| Category | By year | Published example | Physical figure | Game metric interpretation |
| --- | ---: | --- | --- | --- |
| CPU | 2000 | [Intel Pentium III](https://www.intel.com/pressroom/archive/releases/2000/sp030800.htm) | 1.0 GHz | Clock only; **not** IPC-equivalent or game score |
| CPU | 2002 | [Intel Pentium 4 with HT](https://www.intel.com/pressroom/archive/releases/2002/20021114comp.htm) | 3.06 GHz, HT | Clock + SMT reference; not a research date restriction |
| CPU | 2025 | [AMD Ryzen 9 9950X3D](https://www.amd.com/en/products/processors/desktops/ryzen.html) | 16 cores, 32 threads, up to 5.7 GHz, TDP 170 W | Upper-tier **desktop** reference; game `cpu.power` is simplified and does not equal TDP |
| GPU | 2000 | [GeForce2 GTS contemporary report](https://pc.watch.impress.co.jp/docs/article/20000426/winhec05.htm) | 32–64 MB VRAM | 0.032–0.064 GB conversion; CUDA cores and virtual game units cannot be mapped |
| GPU | 2025 | [NVIDIA RTX 5090 launch](https://www.nvidia.com/ja-jp/geforce/news/rtx-50-series-graphics-cards-gpu-laptop-announcements/) | 32 GB GDDR7, 1,792 GB/s | Separate VRAM capacity and bandwidth; 21,760 CUDA cores are **not** game `gpu.units` |
| Motherboard | 2025 | [ASUS ROG Crosshair X870E Hero](https://rog.asus.com/jp/motherboards/rog-crosshair/rog-crosshair-x870e-hero/spec/) | DDR5 support, PCIe 5.0 x16 expansion | `memoryGen` reflects DDR family. `bus` is an invented chipset-bandwidth aggregate, not PCIe5 physical speed |
| RAM | 2025 | [G.SKILL Trident Z5](https://www.gskill.com/specification/165/371/1716256240/F5-8000J4048F24GX2-TZ5K-Specification) | 48 GB dual-stick kit, DDR5-8000 **XMP OC** | 8,000 MT/s is an overclock profile, not official standard speed; kit capacity vs individual module matters |
| Storage | 2025 | [Samsung 9100 PRO, 4 TB](https://news.samsung.com/us/samsung-announces-9100-pro-series-ssds-with-breakthrough-pcie-5-0-performance/) | 14,800 MB/s sequential read, 2.2M random read IOPS | Game `speed` is a single composite throughput input; 2025 historical envelope rounded to **15,000 MB/s** to include this actual product; game random IOPS has its own field |
| PSU | 2025 | [Corsair HX1500i](https://www.corsair.com/jp/ja/p/psu/cp-9020309-jp/hx1500i-fully-modular-ultra-low-noise-platinum-atx-1500-watt-pc-power-supply-jp-cp-9020309-jp) | 1,500 W continuous power, Platinum-class certified | Wattage and efficiency separate; fictional `psu.power` denotes heat/loss proxy |
| Monitor | 2025 | [ASUS ROG Swift Pro PG248QP](https://rog.asus.com/jp/monitors/23-to-24-5-inches/rog-swift-pro-pg248qp/spec/) | 1920×1080 resolution, **540 Hz maximum OC** | `resolution` stores **vertical** 1080 pixels, `refresh` stores maximum Hz; extreme refresh not a typical retail average |

**Field and unit caveats:** MB/s and GB/s differ by ×1000 in the game display convention (decimal storage throughput); GB of VRAM converted from MB should not silently assume a universally applicable binary/decimal standard; CPU 170 W TDP is a cooler-design guideline rather than a directly measured application power reading. Memory transfers/s (MT/s) are not equivalent to a DRAM core clock in MHz. CPU IPC-equivalent, GPU abstract unit count, `monitor.gamut`, pricing and performance score coefficients remain explicitly fictional.

**Prices:** These manufacturer spec pages generally do not provide launch Japanese yen MSRPs for all models in the same market. Do not invent comparable yen price rows. Product/production prices should be calibrated separately with dated country, currency, inclusive tax and currency-rate conventions. This source pass does **not** close #33.

**Coverage gaps:** Complete primary-source 2000/2002/2005/2008/2012/2017/2020/2025 across all seven hardware categories; mainstream vs halo launch price comparisons; desktop/enterprise segmentation; physical wattage and throughput cross-checks; integrated manufacturing costs. Do not treat these few source anchors as a complete year-by-year dataset.
