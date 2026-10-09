// All coefficients are fictional gameplay values, not real forecasts. Money is in yen at real-world scale and sales
// volumes at a hardware startup's scale (economy version 3; older saves are converted on load by `migrateEconomy`).
// Starting cash is a venture-funded hardware startup's (a chip design costs hundreds of millions of yen).
export const balance = {
  moneyLimit: 1_000_000_000_000_000,
  maxAdvance: 365,
  initialCash: { normal: 1_000_000_000, hard: 500_000_000 },
  eventLimit: 500,
  /**
   * Saves without `economyVersion` predate the ×100 money scale; version 2 saves predate real-world design, office
   * and salary costs and the ×10 sales volume. Both are converted by `migrateEconomy`.
   */
  economyVersion: 3,
  legacyMoneyScale: 100,
  /** Starting cash of economy version 2; converted saves receive the difference as new capital. */
  version2InitialCash: { normal: 50_000_000, hard: 25_000_000 },
  version2RivalCash: 20_000_000,
} as const;
