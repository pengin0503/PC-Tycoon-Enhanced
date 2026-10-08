import {rivalBalance as b,rivalTemplates} from '../../content/src/management';
import {defaultSpec,hardwareCatalog} from '../../content/src/hardware';
import {evaluateHardware} from './hardware';
import {assemblyOverhead} from './devices';
import {deviceSlots} from '../../content/src/devices';
import {inventoryValue} from './inventory';
import {expense,logEvent} from './finance';
import {nextRandom} from './random';
import {negotiateAcquisition} from './business';
import type {GameState,GameCommand} from './types';
type Rival=GameState['rivals'][number];
export function newRivals(seed:number,difficulty:'normal'|'hard'):Rival[]{return rivalTemplates.map((t,i)=>({...t,cash:b.initialCash,debt:0,seed:(seed^(0x9e3779b9+i))>>>0,efficiency:difficulty==='hard'?b.hardEfficiency:1,researchLevel:0,researchRemaining:0,products:[],acquired:false}));}
function cost(r:Rival,amount:number,mandatory=false){if(!mandatory&&amount>r.cash)return false;const paid=Math.min(r.cash,amount);r.cash-=paid;r.debt+=amount-paid;return true;}
function revenue(r:Rival,amount:number){const repayment=Math.min(r.debt,amount);r.debt-=repayment;r.cash+=amount-repayment;}
export function settleProcurement(r:Rival,p:Rival['products'][number],units:number){if(units>p.inventory||units<0||r.acquired)throw new Error('競合部品の在庫が不足しています');p.inventory-=units;p.sold+=units;p.revenue+=units*p.price;p.profit+=units*(p.price-p.unitCost);revenue(r,units*p.price);}
export function rivalDaily(s:GameState){
 for(const r of s.rivals.filter(r=>!r.acquired&&r.debt===0)){
  const products=r.products.filter(p=>p.remaining===0);let available=b.capacity;
  for(const p of products){const count=Math.min(Math.ceil(available/products.length),Math.max(0,b.inventoryTarget-p.inventory),Math.floor(r.cash/p.unitCost));if(count){cost(r,count*p.unitCost);p.inventory+=count;available-=count;}}
 }
}
export function rivalWeekly(s:GameState){
 for(const r of s.rivals.filter(r=>!r.acquired)){
  if(r.researchRemaining>0){r.researchRemaining=Math.max(0,r.researchRemaining-b.work*r.efficiency);if(r.researchRemaining===0)r.researchLevel++;}
  for(const p of r.products){const wasDeveloping=p.remaining>0;p.remaining=Math.max(0,p.remaining-b.work*r.efficiency);if(p.remaining>0)continue;
   if(wasDeveloping)logEvent(s,'rivalLaunch',`${r.name}: ${p.name}`);
   const [rand,seed]=nextRandom(r.seed);r.seed=seed;const player=s.products.filter(v=>v.launched&&v.kind===p.kind).reduce((n,v)=>n+v.performance/v.price,0);
   const competition=1/(1+player/(p.performance/p.price)*b.playerPressure);
   const count=Math.min(p.inventory,Math.floor(hardwareCatalog[r.focus].demand*r.efficiency*competition*(b.demandFloor+rand*b.demandVariance)*(p.unitCost*b.priceCostMultiple/p.price)));
   if(count){p.inventory-=count;p.sold+=count;p.revenue+=count*p.price;p.profit+=count*(p.price-p.unitCost);revenue(r,count*p.price);}
  }
 }
}
export function rivalMonthly(s:GameState){
 for(const r of s.rivals.filter(r=>!r.acquired)){
  cost(r,b.monthlyCost,true);if(r.debt>0)continue;
  if(r.researchRemaining===0&&r.researchLevel<b.maxResearch&&cost(r,b.researchCost*(r.researchLevel+1)))r.researchRemaining=b.work*(r.researchLevel+1);
  const latest=r.products.at(-1);if(r.researchLevel>0&&(!latest||Number(latest.spec.generation)<r.researchLevel)&&cost(r,b.designCost)){
   const spec=defaultSpec(r.focus);const metrics=evaluateHardware(r.focus,spec,[`${r.focus}-compute-1`]);metrics.performance=Math.round(metrics.performance*(1+b.generationPerformance*r.researchLevel)*r.efficiency);
   r.products.push({id:`${r.id}-p-${r.products.length+1}`,name:`${r.name} ${r.researchLevel}`,kind:r.focus,spec:{...spec,generation:r.researchLevel},...metrics,remaining:b.developmentWork,price:metrics.unitCost*b.priceCostMultiple,inventory:0,target:b.inventoryTarget,line:true,launched:true,sold:0,revenue:0,profit:0,releaseDay:s.day});
  }
  for(const p of r.products){const alternatives=s.products.filter(v=>v.kind===p.kind&&v.launched);const price=alternatives.length?Math.min(...alternatives.map(v=>v.price))*b.priceUndercut:p.unitCost*b.priceCostMultiple;p.price=Math.max(Math.ceil(p.unitCost*b.minimumPriceCostMultiple),Math.round(price));}
 }
}
export function competitorPressure(s:GameState,kind:string){return 1/(1+s.rivals.filter(r=>!r.acquired).reduce((n,r)=>n+r.products.filter(p=>p.kind===kind&&p.remaining===0&&p.inventory>0).length*b.pressure,0));}
export function marketShare(s:GameState){const own=s.products.reduce((n,p)=>n+p.sold,0);const other=s.rivals.filter(r=>!r.acquired).reduce((n,r)=>n+r.products.reduce((v,p)=>v+p.sold,0),0);return own+other?own/(own+other):0;}
export function valuation(s:GameState,id:string){const r=s.rivals.find(r=>r.id===id);if(!r)throw new Error('競合が存在しません');return Math.max(b.valuationBase,Math.round(r.cash-r.debt+r.researchLevel*b.valuationPerTech+b.valuationBase+r.products.reduce((n,p)=>n+p.inventory*p.unitCost,0)));}
export function rivalCommand(s:GameState,c:GameCommand):boolean{
 if(c.type!=='acquire')return false;const r=s.rivals.find(r=>r.id===c.id);if(!r||r.acquired)throw new Error('買収対象を確認してください');
 const products=r.products.filter(p=>p.remaining===0);if(s.products.length+products.length>500)throw new Error('製品数の上限です');
 const price=negotiateAcquisition(s,r,valuation(s,r.id),c.offer);if(price===null)return true;
 expense(s,price,false,true);s.company.cash+=r.cash;s.company.debt+=r.debt;r.cash=0;r.debt=0;r.acquired=true;
 if(r.researchLevel>0&&!s.research.completed.includes(`${r.focus}-compute-1`))s.research.completed.push(`${r.focus}-compute-1`);
 const mapping=new Map<string,string>();
 const affected=s.products.filter(p=>(p.kind==='pc'||p.kind==='laptop')&&deviceSlots.some(k=>products.some(part=>part.id===p.spec[k])));
 const overheads=new Map(affected.map(p=>[p.id,assemblyOverhead(s,p)]));
 for(const p of products){
  const id=`p-${s.products.length+1}`;mapping.set(p.id,id);
  s.products.push({...p,id,spec:defaultSpec(r.focus),inventoryValue:inventoryValue(p),remaining:0,line:false,sold:0,revenue:0,profit:0});
  p.inventory=0;p.inventoryValue=0;
 }
 for(const p of affected){
  const spec:Record<string,string|number>={...p.spec,assemblyOverhead:overheads.get(p.id)!};
  for(const key of deviceSlots){const replacement=mapping.get(String(spec[key]));if(replacement)spec[key]=replacement;}
  p.spec=spec;
 }
 logEvent(s,'acquired',r.name);return true;
}
