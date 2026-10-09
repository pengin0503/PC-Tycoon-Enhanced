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
