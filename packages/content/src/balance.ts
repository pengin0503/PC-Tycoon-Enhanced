// All coefficients are fictional gameplay values, not real forecasts.
export const balance = {
  moneyLimit: 1_000_000_000_000,
  maxAdvance: 365,
  monthlyBase: 12_000,
  initialCash: { normal: 500_000, hard: 250_000 },
  eventLimit: 500,
} as const;
