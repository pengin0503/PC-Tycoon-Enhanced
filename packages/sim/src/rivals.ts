import {rivalBalance as b,rivalTemplates,rivalFanBalance} from '../../content/src/management';
import {defaultSpec,hardwareCatalog} from '../../content/src/hardware';
import {researchAtShare} from '../../content/src/tech-catalog';
import {typicalSpec} from './market';
import {evaluateHardware} from './hardware';
import {assemblyOverhead} from './devices';
import {deviceSlots} from '../../content/src/devices';
import {inventoryValue} from './inventory';
import {expense,logEvent} from './finance';
import {nextRandom} from './random';
import {recordMarketSale} from './market-share';
import {negotiateAcquisition} from './business';
import type {GameState,GameCommand} from './types';
type Rival=GameState['rivals'][number];
export function newRivals(seed:number,difficulty:'normal'|'hard',mode:GameState['mode']='standard'):Rival[]{return rivalTemplates.map((t,i)=>({...t,cash:b.initialCash,debt:0,seed:(seed^(0x9e3779b9+i))>>>0,efficiency:(difficulty==='hard'?b.hardEfficiency:1)*(mode==='long'?b.longEfficiency:1),researchLevel:0,researchRemaining:0,products:[],acquired:false,fans:rivalFanBalance.initial}));}
function cost(r:Rival,amount:number,mandatory=false){if(!mandatory&&amount>r.cash)return false;const paid=Math.min(r.cash,amount);r.cash-=paid;r.debt+=amount-paid;return true;}
function revenue(r:Rival,amount:number){const repayment=Math.min(r.debt,amount);r.debt-=repayment;r.cash+=amount-repayment;}
export function settleProcurement(r:Rival,p:Rival['products'][number],units:number,s?:GameState){if(units>p.inventory||units<0||r.acquired)throw new Error('競合部品の在庫が不足しています');p.inventory-=units;p.sold+=units;if(s)recordMarketSale(s,r.id,p.kind,units);p.revenue+=units*p.price;p.profit+=units*(p.price-p.unitCost);revenue(r,units*p.price);}
export function rivalManufacture(s:GameState){
 // Keep production isolated so manufacturing tests do not run retail transactions.
 for(const r of s.rivals.filter(r=>!r.acquired&&r.debt===0)){
  const products=r.products.filter(p=>p.remaining===0);let available=b.capacity;
  if(!products.length)continue;
  const offset=s.day%products.length;
  for(let i=0;i<products.length;i++){
   const p=products[(i+offset)%products.length];
   const count=Math.min(Math.ceil(available/(products.length-i)),Math.max(0,b.inventoryTarget-p.inventory),Math.floor(r.cash/p.unitCost));
   if(count){cost(r,count*p.unitCost);p.inventory+=count;available-=count;}
  }
 }
}
export function rivalDaily(s:GameState){
 rivalManufacture(s);
 for(const r of s.rivals.filter(r=>!r.acquired)){
  for(const p of r.products.filter(p=>p.remaining===0)){
   const [rand,seed]=nextRandom(r.seed);r.seed=seed;
   const player=s.products.filter(v=>onSale(v)&&v.kind===p.kind).reduce((n,v)=>n+v.performance/v.price,0);
   const competition=1/(1+player/(p.performance/p.price)*b.playerPressure);
   const weeklyExpected=hardwareCatalog[r.focus].demand*r.efficiency*competition*(b.demandFloor+rand*b.demandVariance)*(p.unitCost*b.priceCostMultiple/p.price);
   const dailyExpected=Math.max(0,weeklyExpected/7);
   const count=Math.min(p.inventory,Math.floor(dailyExpected)+(rand<dailyExpected%1?1:0));
   if(count){p.inventory-=count;p.sold+=count;recordMarketSale(s,r.id,p.kind,count);p.revenue+=count*p.price;p.profit+=count*(p.price-p.unitCost);revenue(r,count*p.price);r.fans=rivalFans(r)+count*rivalFanBalance.perUnit;}
  }
 }
}
export function rivalWeekly(s:GameState){
 for(const r of s.rivals.filter(r=>!r.acquired)){
  r.fans=Math.round(rivalFans(r)*rivalFanBalance.weeklyDecay*100)/100;
  if(r.researchRemaining>0){r.researchRemaining=Math.max(0,r.researchRemaining-b.work*r.efficiency);if(r.researchRemaining===0)r.researchLevel++;}
  for(const p of r.products){
   const wasDeveloping=p.remaining>0;
   p.remaining=Math.max(0,p.remaining-b.work*r.efficiency);
   if(wasDeveloping&&p.remaining===0)logEvent(s,'rivalLaunch',`${r.name}: ${p.name}`);
  }
 }
}
export function rivalMonthly(s:GameState){
 for(const r of s.rivals.filter(r=>!r.acquired)){
  cost(r,b.monthlyCost,true);if(r.debt>0)continue;
  // The first level is a quick catch-up to year-2000 technology; each later level is about two years of work.
  if(r.researchRemaining===0&&r.researchLevel<b.maxResearch&&cost(r,b.researchCost*(r.researchLevel+1)))r.researchRemaining=b.work*(r.researchLevel?b.levelWeeks:1);
  const latest=r.products.at(-1);if(r.researchLevel>0&&(!latest||Number(latest.spec.generation)<r.researchLevel)&&cost(r,hardwareCatalog[r.focus].designCost)){
   // Rivals build the mainstream design of their technology level (level 50 = year-2100 technology).
   const share=Math.min(1,(r.researchLevel-1)/(b.maxResearch-1));
   const spec=typicalSpec(r.focus,share);const metrics=evaluateHardware(r.focus,spec,researchAtShare(r.focus,share),{stored:true});metrics.performance=Math.round(metrics.performance*r.efficiency);
   r.products.push({id:`${r.id}-p-${r.products.length+1}`,name:`${r.name} ${r.researchLevel}`,kind:r.focus,spec:{...spec,generation:r.researchLevel},...metrics,remaining:b.developmentWork,price:metrics.unitCost*b.priceCostMultiple,inventory:0,target:b.inventoryTarget,line:true,launched:true,sold:0,revenue:0,profit:0,releaseDay:s.day});
  }
  for(const p of r.products){const alternatives=s.products.filter(v=>v.kind===p.kind&&onSale(v));const price=alternatives.length?Math.min(...alternatives.map(v=>v.price))*b.priceUndercut:p.unitCost*b.priceCostMultiple;p.price=Math.max(Math.ceil(p.unitCost*b.minimumPriceCostMultiple),Math.round(price));}
 }
}
/** Fans of a rival brand (saves converted before rival fans existed derive them from sales). */
export function rivalFans(r:Rival){return r.fans??rivalFanBalance.initial+r.products.reduce((n,p)=>n+p.sold,0)*rivalFanBalance.perUnit;}
/** Whether a player product is currently offered to customers (launched and not discontinued). */
export function onSale(p:GameState['products'][number]){return p.launched&&p.discontinuedDay===undefined;}
export function competitorPressure(s:GameState,kind:string){return 1/(1+s.rivals.filter(r=>!r.acquired).reduce((n,r)=>n+r.products.filter(p=>p.kind===kind&&p.remaining===0&&p.inventory>0).length*b.pressure,0));}
export function marketShare(s:GameState){const own=s.products.reduce((n,p)=>n+p.sold,0);const other=s.rivals.reduce((n,r)=>n+r.products.reduce((v,p)=>v+p.sold,0),0);return own+other?own/(own+other):0;}
export function valuation(s:GameState,id:string){const r=s.rivals.find(r=>r.id===id);if(!r)throw new Error('競合が存在しません');return Math.max(b.valuationBase,Math.round(r.cash-r.debt+r.researchLevel*b.valuationPerTech+b.valuationBase+r.products.reduce((n,p)=>n+p.inventory*p.unitCost,0)));}
export function rivalCommand(s:GameState,c:GameCommand):boolean{
 if(c.type!=='acquire')return false;const r=s.rivals.find(r=>r.id===c.id);if(!r||r.acquired)throw new Error('買収対象を確認してください');
 const products=r.products.filter(p=>p.remaining===0);if(s.products.length+products.length>500)throw new Error('製品数の上限です');
 const price=negotiateAcquisition(s,r,valuation(s,r.id),c.offer);if(price===null)return true;
 expense(s,price,false,true);s.company.cash+=r.cash;s.company.debt+=r.debt;r.cash=0;r.debt=0;r.acquired=true;
 // The acquired brand's customers follow it: its whole fan base joins the company.
 const fans=Math.floor(rivalFans(r));s.company.fans+=fans;r.fans=0;
 if(r.researchLevel>0&&!s.research.completed.includes(`${r.focus}-compute-1`))s.research.completed.push(`${r.focus}-compute-1`);
 const mapping=new Map<string,string>();
 const affected=s.products.filter(p=>(p.kind==='pc'||p.kind==='laptop')&&deviceSlots.some(k=>products.some(part=>part.id===p.spec[k])));
 const overheads=new Map(affected.map(p=>[p.id,assemblyOverhead(s,p)]));
 for(const p of products){
  const id=`p-${s.products.length+1}`;mapping.set(p.id,id);
  const {generation:_generation,...spec}=p.spec;
  s.products.push({...p,id,spec:hardwareCatalog[r.focus]&&Object.keys(spec).every(k=>k in hardwareCatalog[r.focus].fields)?spec:defaultSpec(r.focus),inventoryValue:inventoryValue(p),remaining:0,line:false,sold:0,revenue:0,profit:0});
  p.inventory=0;p.inventoryValue=0;
 }
 for(const p of affected){
  const spec:Record<string,string|number>={...p.spec,assemblyOverhead:overheads.get(p.id)!};
  for(const key of deviceSlots){const replacement=mapping.get(String(spec[key]));if(replacement)spec[key]=replacement;}
  p.spec=spec;
 }
 logEvent(s,'acquired',`${r.name}（ファン ${fans.toLocaleString('ja-JP')}人を獲得）`);return true;
}

