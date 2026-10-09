# Historical hardware milestones and PC Tycoon Enhanced era calibration

Status: historical calibration baseline (2026-10-09). Real component specifications are evidence; game scores, research stages, and simulated years are **not** real-world benchmark-equivalent values.

## Primary-source milestones

| Date | Real event | Game rule / interpretation | Evidence |
| --- | --- | --- | --- |
| 2000-03-08 | Intel Pentium III reaches 1.0 GHz; SPECint2000 410, SPECfp2000 284, SYSmark 2000 188 | Year-2000 starting CPU is single-core, 0.8 GHz default; a 1.0 GHz CPU is plausible in that year. Game's abstract performance score is **not** SPECint2000. | [Intel, March 8 2000](https://www.intel.com/pressroom/archive/releases/2000/sp030800.htm) |
| 2002-11-14 | Pentium 4 at 3.06 GHz introduces consumer desktop Hyper-Threading | SMT/HT option begins in year 2002, rather than 2000 | [Intel, November 14 2002](https://www.intel.com/pressroom/archive/releases/2002/20021114comp.htm) |
| 2005-04-18 | First dual-core Intel desktop platforms become available, Pentium Extreme Edition 840 at 3.2 GHz | New CPU-capacity research cannot enable multicore until 2005 | [Intel, April 18 2005](https://www.intel.com/pressroom/archive/releases/2005/20050418comp.htm) |
| 2017 | Original Transformer architecture published in *Attention Is All You Need* | Transformer-based simulated AI research starts in 2017 | [Google Research, 2017](https://research.google/pubs/attention-is-all-you-need/) |

## Implementation and limitations

- Game starts in 2000, with 360 simulated days per game-year. Historical availability is checked when buying new research; previously saved research and products are retained.
- Player research for all supported families has calendar-year availability checks. First compute level allows a category to exist in 2000; later stages advance by a 2000–2100 calendar schedule, with explicit 2005 minimum for desktop multicore and 2017 for Transformer simulation.
- The existing 2000 starting specification and hardware slider progression are stylized. Calendar release gates should not be misconstrued as strict fidelity to actual transistor density, CPU IPC, VRAM bandwidth, HDD IOPS or display standards.
- For scientific fidelity, **data-backed** year-by-year ceilings must separately constrain each numeric field, including GPU shader counts, RAM generation/speed/capacity, storage and CPU cache/process. This remains a follow-up task; interpolation to 2100 is hypothetical.
- Distinguish desktop from server hardware: multiple CPUs were available in workstations before 2005, but a consumer single-package dual-core desktop processor is a later milestone.
- Market-share percentages in this release represent a game's cumulative observed units among player and simulated rival firms, **not** worldwide market share; the game does not explicitly model the whole exogenous hardware market.

## 2026-10-09: Calendar bounds for new designs (issue #33)

New `packages/content/src/historical-limits.ts` intersects research progress with a **calendar-specific ceiling**. Existing completed products and old save specs are preserved; future research cannot create 2000-era 2-core CPUs merely by importing completed research.

The dates below are a **game-balance envelope**, not a dataset of exact high-end products. These are model-selected conservative constraints that must be verified against original launch specifications before the issue can be fully accepted.

| Game year | CPU cores, max | CPU GHz, max | GPU VRAM, max GB | GPU bandwidth, max GB/s | RAM generation latest |
| --- | ---: | ---: | ---: | ---: | --- |
| 2000 | 1 | 1.5 | 0.064 | 5.3 | DDR |
| 2002 | 1 | 3.1 | 0.128 | 11 | DDR |
| 2005 | 2 | 3.8 | 0.256 | 35 | DDR2 |
| 2008 | 4 | 4.0 | 1 | 120 | DDR3 |
| 2012 | 8 | 4.5 | 6 | 288 | DDR3 |
| 2017 | 16 | 5.0 | 12 | 484 | DDR4 |
| 2020 | 64 | 5.3 | 24 | 936 | DDR4 |
| 2025 | 192 | 6 | 32 | 1792 | DDR5 |

**Source-backed anchor points:**
- Intel's [processor launch guide](https://www.intel.com/pressroom/kits/quickrefyr.htm) lists 1GHz Pentium III (2000-03-08), and Intel's [product chronology](https://www.intel.co.jp/content/dam/www/central-libraries/jp/ja/documents/2022-05/history-of-intel-jp.pdf) identifies the 2005 consumer dual-core product.
- NVIDIA's [GeForce 8800 architecture technical brief](https://www.nvidia.com/content/PDF/Geforce_8800/GeForce_8800_GPU_Architecture_Technical_Brief.pdf) documents 768MB GDDR3 with 86.4GB/s bandwidth in the 2006 8800 GTX. The model's 2005/2008 neighboring limits are **not** specifications for that card.
- Samsung's [2021 DDR5 mass production notice](https://news.samsung.com/us/samsung-14nm-euv-ddr5-dram-mass-production-most-advanced/) corroborates the DDR5 era.

The year-2025 caps on CPU cores refer to high-end workstation/server markets, not ordinary consumer desktop tiers. IPC-equivalent, GPU abstract compute-unit count, PC benchmark score, storage IOPS and motherboard chipset bandwidth remain simulator quantities, not homologated real benchmark units. Future game years 2026–2100 intentionally interpolate toward fictional design bounds; such extrapolation is not a forecast.

**Next research work before closing #33:** source 2000/2002/2005/2008/2012/2017/2020/2025 launch documents per component category; distinguish mainstream vs halo products; validate PSU, monitor, RAM density/latency, storage generation and GPU computation units with evidence. No undocumented claim of exact historical fidelity.
