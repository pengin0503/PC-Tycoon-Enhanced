import {balance} from '../../content/src/balance';
import {eraBalance} from '../../content/src/era';
import {eventBalance} from '../../content/src/events';
import {rivalBalance} from '../../content/src/management';
import {salaryFor} from './business';
import {newRivals,retireRivalModels} from './rivals';
import {researchBranches,techById} from '../../content/src/tech-catalog';
import {researchDomains,researchLevels} from '../../content/src/research';
import {rivalFanBalance} from '../../content/src/management';
import type {GameState,Product} from './types';

/**
 * Research of economy version 3 and older: four shared branches per category (`compute`, `power`, `capacity`,
 * `compatibility`; `cost`/`reliability` retired) each widened several specifications. Version 4 gives every
 * specification its own branch; this table lists which old branches each new branch inherits its progress from.
 */
const legacyUnlocks:Record<string,Record<string,readonly string[]>>={
 cpu:{cores:['capacity'],clock:['compute'],ipc:['compute'],process:['power'],l1Cache:['compatibility'],l2Cache:['compatibility'],l3Cache:['capacity'],smt:['compute'],memoryChannels:['compatibility'],cooling:['power']},
 gpu:{units:['capacity'],clock:['compute'],vram:['capacity'],bandwidth:['compatibility'],busWidth:['compatibility'],process:['power'],cooling:['power']},
 motherboard:{memoryGen:['compatibility'],slots:['compatibility'],usb:['compute'],storagePorts:['compute'],lan:['compute'],bus:['compute','compatibility']},
 ram:{memoryGen:['compatibility'],capacity:['capacity'],latency:['compatibility'],speed:['compute','compatibility']},
 storage:{capacity:['capacity'],speed:['compute','compatibility'],writeSpeed:['compute','compatibility'],iops:['compute']},
 psu:{wattage:['capacity','compute'],efficiency:['power','compatibility'],modular:['compatibility']},
 monitor:{size:['capacity'],resolution:['capacity'],refresh:['compute'],panel:['compatibility'],response:['compute'],brightness:['compute'],gamut:['compatibility']},
 pc:{cooling:['power','compute','compatibility']},laptop:{cooling:['power','compute','compatibility']},
 os:{quality:['compute','reliability'],compatibility:['compatibility'],support:['capacity']},
 ai:{params:['compute'],layers:['architecture'],hidden:['architecture'],contextLength:['context'],tokens:['data']},
};
/** OS features used to be gated by stages of the shared branches. */
const legacyFeatures:Record<string,string>={'os-security-1':'os-reliability-1','os-media-1':'os-capacity-1','os-games-1':'os-compute-2','os-store-1':'os-compatibility-1'};
/**
 * Converts research ids of a save older than economy version 4 (a raw, not yet validated save object) to per-specification
 * branches. A new branch receives the stages matching the old research share of the branches that used to widen it,
 * rounded up so no designed range is lost. Category foundations, appearance research and AI bonus branches keep their ids.
 */
export function migrateResearchIds(raw:Record<string,unknown>):Record<string,unknown>{
 const version=raw.economyVersion;
 const research=raw.research as {completed?:unknown,active?:unknown}|undefined;
 if(typeof version==='number'&&version>=4||!research||!Array.isArray(research.completed))return raw;
 const old=new Set(research.completed.filter((id):id is string=>typeof id==='string'));
 const level=(category:string,axis:string)=>{let n=0;for(let i=1;old.has(`${category}-${axis}-${i}`);i++)n=i;return n;};
 const share=(category:string,axis:string)=>axis==='compute'?Math.max(0,level(category,axis)-1)/(researchLevels-1):level(category,axis)/researchLevels;
 const completed:string[]=[];
 for(const category of researchDomains){
  if(!old.has(`${category}-compute-1`))continue;
  for(const b of researchBranches(category)){
   const inherited=legacyUnlocks[category]?.[b.axis];
   let stages=0;
   if(b.axis==='compute'&&category!=='ai')stages=1;
   else if(category==='ai'&&b.kind!=='slider')stages=level(category,b.axis);
   else if(inherited)stages=Math.min(b.levels,Math.ceil(inherited.reduce((n,a)=>n+share(category,a),0)/inherited.length*researchLevels-1e-9));
   else if(b.kind==='feature')stages=old.has(legacyFeatures[`${category}-${b.axis}-1`]??'')?1:0;
   for(let i=1;i<=stages;i++)completed.push(`${category}-${b.axis}-${i}`);
  }
  for(let i=1;old.has(`${category}-visual-${i}`);i++)completed.push(`${category}-visual-${i}`);
 }
 const done=new Set(completed);
 const active=Array.isArray(research.active)?research.active.filter(r=>typeof r==='object'&&r!==null&&techById.has(String((r as {id?:unknown}).id))&&!done.has(String((r as {id?:unknown}).id))):[];
 return {...raw,research:{...research,completed,active}};
}

/** Converts a save from any earlier economy version to the current one (see `toVersion2` … `toVersion5`). */
export function migrateEconomy(input:GameState):GameState{
 const legacyRivalRoster=input.rivals.length===3&&input.rivals.every((r,i)=>r.id===`r-${i+1}`);
 const needsEconomyMigration=input.economyVersion!==balance.economyVersion;
 if(!needsEconomyMigration&&!legacyRivalRoster)return input;
 const s=structuredClone(input);
 const from=s.economyVersion;
 if(needsEconomyMigration){
  if(from===undefined)toVersion2(s);
  if((from??2)<3)toVersion3(s);
 }
 // Preserve the original companies' state, ownership, inventory, and seed when upgrading a 3-rival save.
 // Expand only known legacy rosters; custom rosters must never be silently replaced.
 if(legacyRivalRoster){
  const existing=new Set(s.rivals.map(r=>r.id));
  s.rivals.push(...newRivals(s.initialSeed,s.difficulty,s.mode).filter(r=>!existing.has(r.id)));
 }
 if(needsEconomyMigration){
  if((from??2)<4)toVersion4(s);
  if((from??2)<5)toVersion5(s);
  s.economyVersion=balance.economyVersion;
 }
 return s;
}
/**
 * Version 5 adds the year-2200 research tier, company sockets and per-kind monthly sales (new data needs no
 * conversion). It starts the last-sale date of products that have sold at the migration day and has rivals retire old
 * models: each independent rival keeps its newest `rivalBalance.activeModels` released models and clears the stock of
 * older ones at the clearance price, as it now does whenever a new model is released.
 */
function toVersion5(s:GameState){
 for(const r of s.rivals)if(!r.acquired)retireRivalModels(s,r);
 // Older saves never recorded the last sale; treat products that have sold as selling up to now, so the 90-day
 // "no sales" hint starts counting from the migration instead of from their release.
 for(const p of s.products)if(p.sold>0&&p.lastSaleDay===undefined)p.lastSaleDay=s.day;
}
/**
 * Version 4 gives every specification its own research branch (research ids are converted before validation by
 * `migrateResearchIds`) and gives rivals a fan base that an acquisition transfers. Rivals start from the base of a new
 * game plus fans from what they have already sold; acquired rivals' fans are treated as already absorbed.
 */
function toVersion4(s:GameState){
 for(const r of s.rivals)if(r.fans===undefined)r.fans=r.acquired?0:Math.round(rivalFanBalance.initial+r.products.reduce((n,p)=>n+p.sold,0)*rivalFanBalance.perUnit);
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
