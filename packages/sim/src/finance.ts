import type { GameState } from './types';
export function logEvent(s: GameState, kind: string, detail = '') {
  s.events.push({day:s.day,kind,detail}); s.events = s.events.slice(-500);
}
export function expense(s: GameState, amount: number, mandatory = false, capital = false) {
  if (!Number.isSafeInteger(amount) || amount < 0) throw new Error('金額が不正です');
  if (!mandatory && (s.company.cash < amount || s.company.debt > 0)) throw new Error('資金不足です');
  const paid = Math.min(amount,s.company.cash);
  s.company.cash -= paid; s.company.debt += amount-paid;
  s.finance[capital ? 'capital' : 'expenses'] += amount;
  if (paid < amount) logEvent(s,'insolvency',String(amount-paid));
}
export function income(s: GameState, amount: number) {
  if (!Number.isSafeInteger(amount) || amount < 0) throw new Error('金額が不正です');
  const repay=Math.min(amount,s.company.debt); s.company.debt-=repay;
  s.company.cash+=amount-repay; s.finance.revenue+=amount;
}
