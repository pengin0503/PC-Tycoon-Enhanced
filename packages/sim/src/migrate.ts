import {balance} from '../../content/src/balance';
import {eraBalance} from '../../content/src/era';
import {eventBalance} from '../../content/src/events';
import {rivalBalance} from '../../content/src/management';
import {salaryFor} from './business';
import type {GameState,Product} from './types';

/** Converts a save from any earlier economy version to the current one (see `toVersion2` and `toVersion3`). */
export function migrateEconomy(input:GameState):GameState{
 if(input.economyVersion===balance.economyVersion)return input;
 const s=structuredClone(input);
 if(s.economyVersion===undefined)toVersion2(s);
 toVersion3(s);
 s.economyVersion=balance.economyVersion;
 return s;
}
/**
 * Version 2 introduced real-world design, office and salary costs, a venture-funded start and ×10 sales volumes.
 * A version 2 company keeps what it built and receives the difference in starting capital (rivals likewise), so it
 * can afford the new design costs; salaries follow the new pay scale.
 */
function toVersion3(s:GameState){
 s.company.cash+=balance.initialCash[s.difficulty]-balance.version2InitialCash[s.difficulty];
 for(const r of s.rivals)if(!r.acquired)r.cash+=rivalBalance.initialCash-balance.version2RivalCash;
 for(const e of s.staff)e.salary=salaryFor(e.skill,e.trait);
}
/**
 * Converts a save from before economy version 2 (money at 1/100 of today's yen scale, start year chosen freely):
 * every stored amount of money is multiplied by `legacyMoneyScale`, the calendar restarts from 2000 so dates match
 * the technology eras, and rival technology levels are capped to what the calendar allows. AI service prices are
 * kept: they were already at real-world scale. Product specs and metrics are kept as designed.
 */
function toVersion2(s:GameState){
 const k=balance.legacyMoneyScale;
 const scale=(n:number)=>Math.round(n*k);
 const product=(p:Product)=>{
  p.unitCost=scale(p.unitCost);p.price=Math.min(1e8,scale(p.price));p.revenue=scale(p.revenue);p.profit=scale(p.profit);
  if(p.inventoryValue!==undefined)p.inventoryValue=scale(p.inventoryValue);
  for(const key of ['assemblyOverhead','procurementCost'])if(typeof p.spec[key]==='number')p.spec[key]=scale(Number(p.spec[key]));
 };
 s.company.cash=scale(s.company.cash);s.company.debt=scale(s.company.debt);s.company.loan=scale(s.company.loan);
 s.finance={revenue:scale(s.finance.revenue),expenses:scale(s.finance.expenses),capital:scale(s.finance.capital)};
 s.advertising=scale(s.advertising);
 s.products.forEach(product);
 for(const r of s.rivals){
  r.cash=scale(r.cash);r.debt=scale(r.debt);r.products.forEach(product);
  if(r.researchLevel>0)r.researchLevel=Math.min(r.researchLevel,1+Math.floor(s.day/(7*rivalBalance.levelWeeks)));
 }
 for(const e of s.staff)e.salary=scale(e.salary);
 s.history=s.history.map(h=>({...h,cash:scale(h.cash),debt:scale(h.debt),loan:scale(h.loan),revenue:scale(h.revenue),expenses:scale(h.expenses),capital:scale(h.capital)}));
 for(const o of s.offers)o.unitPrice=Math.min(1e8,scale(o.unitPrice));
 if(s.pendingDecision){
  const cost=s.pendingDecision.id==='supply-boost'?eventBalance.supplyBoostCost:eventBalance.demandCampaignCost;
  s.pendingDecision={...s.pendingDecision,cost,description:s.pendingDecision.description.replace(/^[\d,]+円/,`${cost.toLocaleString('ja-JP')}円`)};
 }
 for(const c of s.clusters)c.purchaseCost=scale(c.purchaseCost);
 for(const m of s.models){m.trainingCost=scale(m.trainingCost);if(m.service){m.service.revenue=scale(m.service.revenue);m.service.cost=scale(m.service.cost);}}
 s.year=eraBalance.startYear;
}
