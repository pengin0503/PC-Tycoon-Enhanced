// All coefficients are fictional gameplay values, not real forecasts. Money is in yen at roughly real-world scale
// (economy version 2: amounts are 100× those of the first releases; older saves are converted on load).
export const balance = {
  moneyLimit: 1_000_000_000_000_000,
  maxAdvance: 365,
  monthlyBase: 1_200_000,
  initialCash: { normal: 50_000_000, hard: 25_000_000 },
  eventLimit: 500,
  /** Saves without `economyVersion` predate the ×100 money scale and are converted by `migrateEconomy`. */
  economyVersion: 2,
  legacyMoneyScale: 100,
} as const;
