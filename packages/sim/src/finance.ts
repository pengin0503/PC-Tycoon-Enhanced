import type { GameState } from './types';
export function logEvent(s: GameState, kind: string, detail = '') {
  s.events.push({day:s.day,kind,detail}); s.events = s.events.slice(-500);
  const categories:Record<string,'release'|'research'|'finance'|'event'>={
    rivalLaunch:'release',launched:'release',researchComplete:'research',designComplete:'research',
    insolvency:'finance',serviceStopped:'finance',marketEvent:'event',decisionPending:'event',
    eventDecision:'event',acquired:'finance'
  };
  const category=categories[kind];
  if(category){
    s.notificationSeq++;
    s.notifications.push({id:s.notificationSeq,day:s.day,kind,detail,category});
    s.notifications=s.notifications.slice(-200);
  }
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
