import {hardwareCatalog,hardwareBalance as b,normalizeSpec,fieldRange,fieldOptions,fieldGrowth,coolingReliability,type Spec} from '../../content/src/hardware';
import {techById,researchIsAvailable,type HardwareKind,techEffect} from '../../content/src/research';
import {expense,logEvent} from './finance';
import {nextRandom} from './random';
import {productCatalog,deviceSlots} from '../../content/src/devices';
import {assemblyOverhead} from './devices';
import {findVendorPart} from './vendor-market';
import {addStock,removeStock} from './inventory';
import {workBonus} from './management';
import {competitorPressure,settleProcurement} from './rivals';
import {assertProductPrice} from './pricing';
import {aiHardwareBoost,founderProjects} from './ai';
import {osIncidentFactor} from './os';
import {researchPointCost,weeklyResearchPoints,distributionDemand,requireRole,hasRole} from './business';
import {validateVisual,visualFinishCost,visualDemandFactor} from './visual';
import {launchReception,reviewDemandFactor,fanDemandFactor,hypeFactor,weeklyFans,decayHype} from './reception';
import {recordProductSale} from './sales';
import {availableForRetail,availableForAssembly} from './inventory-allocation';
import {marketReference,marketYear} from './market';
import {earliestResearchYear} from '../../content/src/era';
import {developmentCost} from './development-cost';
import {eraDemandFactor} from './events';
import type {GameState,GameCommand} from './types';
/** Performance score of a component specification (no research or validation involved). */
export function hardwarePerformance(kind:HardwareKind,spec:Spec){
 const n=(k:string)=>Number(spec[k]);
 switch(kind){
  case'cpu':{
   const cache=spec.l1Cache===undefined?n('cache'):n('l1Cache')+n('l2Cache')+n('l3Cache');
   return n('cores')*n('clock')*n('ipc')*b.cpu.scoreCoefficient*(cache/b.cpu.cacheReference)**b.cpu.cacheExponent*
    (spec.smt==='on'?1.18:1)*(1+.035*(Number(spec.memoryChannels??1)-1));
  }
  case'gpu':{const ops=n('units')*n('clock');return ops*b.gpu.scoreCoefficient*Math.min(1,n('bandwidth')/(ops*b.gpu.bandwidthPerOp))*Math.min(1,Number(spec.busWidth??64)/64);}
  case'motherboard':return (n('slots')*b.motherboard.slotScore+n('features')*b.motherboard.featureScore)*(n('bus')/b.motherboard.busReference)**b.motherboard.busExponent;
  case'ram':return n('capacity')*n('speed')/b.ram.scoreDivisor*(7/Number(spec.latency??7))**.15;
  case'storage':return Math.sqrt(n('capacity')*n('speed'))*b.storage.scoreCoefficient*(Number(spec.iops??100)/100)**.1;
  case'psu':return n('wattage')*n('efficiency')/100*b.psu.modularScore[String(spec.modular) as 'none'|'semi'|'full'];
  case'monitor':return n('resolution')*n('refresh')*n('gamut')*b.monitor.scoreCoefficient;
 }
}
/**
 * Metrics of a component design. New designs must stay inside the research-unlocked slider ranges and options and
 * need cooling at least equal to their power draw. `stored` re-checks an already designed (possibly older) product:
 * its values were accepted under the rules of its time, so research ranges and cooling are not re-applied.
 * Costs use each value divided by its field's research frontier growth (mass production follows the frontier), so the
 * same specification gets cheaper with research; performance and power use the designed values.
 */
export function evaluateHardware(kind:HardwareKind,input:Spec,completed:readonly string[],{stored=false,year}:{stored?:boolean,year?:number}={}){
 const def=hardwareCatalog[kind];
 if(!completed.includes(`${kind}-compute-1`))throw new Error('基盤研究が必要です');
 if(!stored&&'cooling' in def.fields&&input.cooling===undefined)throw new Error('冷却性能を指定してください');
 const spec=normalizeSpec(kind,input);
 for(const [key,field]of Object.entries(def.fields)){
  const v=spec[key];
  if(field.options){if(typeof v!=='string'||!field.options.includes(v))throw new Error(`${field.label}が不正です`);
   if(!stored&&!fieldOptions(kind,key,completed,year).includes(v))throw new Error(`${field.label}「${v}」は研究が必要です`);continue;}
  if(typeof v!=='number'||!Number.isFinite(v)||v<0||(field.step===1&&!Number.isInteger(v)))throw new Error(`${field.label}が不正です`);
  if(stored)continue;
  if(field.values&&!field.values.some(x=>Math.abs(x-v)<1e-9))throw new Error(`${field.label}が不正です`);
  const range=fieldRange(kind,key,completed,year);
  if(v<range.min-1e-9||v>range.max+1e-9){
   const unit=field.unit??'';
   throw new Error(v<Number(field.min)||v>Number(field.max)?`${field.label}が不正です`:`${field.label}は現在の研究では${range.min}～${range.max}${unit}の範囲で設計できます`);
  }
 }
 const n=(k:string)=>Number(spec[k]);
 /** Value in production-cost terms: divided by how far research has moved this field's frontier. */
 const c=(k:string)=>n(k)/fieldGrowth(kind,k,completed);
 const node=(k='process')=>(n(k)/b.referenceProcess)**b.processExponent;
 const legacyCache=kind==='cpu'&&input.l1Cache===undefined&&input.l2Cache===undefined&&input.l3Cache===undefined;
 const performance=hardwarePerformance(kind,legacyCache?{...spec,l1Cache:undefined as unknown as number}:spec);let power=0,unitCost=0;
 switch(kind){
  case'cpu':power=n('cores')*n('clock')*node()*b.cpu.powerCoefficient*(spec.smt==='on'?1.1:1);
   unitCost=b.cpu.baseCost+c('cores')*b.cpu.coreCost+c('clock')*b.cpu.clockCost+c('ipc')*b.cpu.ipcCost+
    (legacyCache?c('cache'):c('l1Cache')+c('l2Cache')+c('l3Cache'))*b.cpu.cacheCost+
    (spec.smt==='on'?1500:0)+Math.max(0,c('memoryChannels')-1)*1200;break;
  case'gpu':power=n('units')**b.gpu.unitsPowerExponent*n('clock')*node()*b.gpu.powerCoefficient;unitCost=b.gpu.baseCost+c('units')*b.gpu.unitCost+c('clock')*b.gpu.clockCost+c('vram')*b.gpu.vramCost+c('bandwidth')*b.gpu.bandwidthCost+Math.max(0,c('busWidth')-64)*75;break;
  case'motherboard':power=b.motherboard.basePower+n('features')*b.motherboard.featurePower;unitCost=b.motherboard.baseCost+n('slots')*b.motherboard.slotCost+n('features')*b.motherboard.featureCost+c('bus')*b.motherboard.busCost;break;
  case'ram':power=b.ram.basePower+c('capacity')*b.ram.powerCoefficient;unitCost=b.ram.baseCost+c('capacity')*b.ram.capacityCost+c('speed')*b.ram.speedCost+Math.max(0,7-c('latency'))*800;break;
  case'storage':power=b.storage.basePower+c('speed')*b.storage.speedPower;unitCost=b.storage.baseCost+c('capacity')*b.storage.capacityCost+c('speed')*b.storage.speedCost+Math.max(0,c('iops')-100)*.05;break;
  case'psu':{const m=String(spec.modular) as 'none'|'semi'|'full';power=n('wattage')*(1-n('efficiency')/100)*b.psu.lossCoefficient;unitCost=b.psu.baseCost+c('wattage')*b.psu.wattageCost+Math.max(0,n('efficiency')-b.psu.efficiencyBase)*b.psu.efficiencyCost/fieldGrowth(kind,'efficiency',completed)+b.psu.modularCost[m];break;}
  case'monitor':power=c('resolution')*b.monitor.powerCoefficient*c('refresh')/b.monitor.referenceRefresh;unitCost=b.monitor.baseCost+c('resolution')*b.monitor.resolutionCost+c('refresh')*b.monitor.refreshCost+n('gamut')*b.monitor.gamutCost;break;
 }
 // Compute/compatibility/capacity research widen the slider ranges above instead of multiplying performance.
 power*=Math.exp(-techEffect(completed,kind,'power'));
 const cooling='cooling' in def.fields?n('cooling'):undefined;
 if(cooling!==undefined)unitCost+=c('cooling')*(b.cooling.cost[kind]??0);
 unitCost*=Math.exp(-techEffect(completed,kind,'cost')*b.costResearchScale);
 power=Math.round(power);
 if(cooling!==undefined&&!stored&&power>cooling)throw new Error(`冷却性能が不足しています（消費電力 ${power}W / 冷却性能 ${cooling}W）`);
 const reliability=b.reliabilityBase+b.reliabilityGain*(1-Math.exp(-techEffect(completed,kind,'reliability')))+(cooling?coolingReliability(power,cooling):0);
 return{performance:Math.max(1,Math.round(performance)),power,unitCost:Math.max(1,Math.round(unitCost)),reliability:Math.min(1,reliability)};
}
export function hardwareCommand(s:GameState,c:GameCommand):boolean{
 if(c.type==='research'){
  const t=techById.get(c.id);if(!t)throw new Error('研究が存在しません');
  requireRole(s,'research');
  if(!researchIsAvailable(t.category,t.axis))throw new Error('この研究系統は廃止されました');
  const releaseYear=earliestResearchYear(t);if(marketYear(s.day)<releaseYear)throw new Error(`この技術は${releaseYear}年に解禁されます`);
  if(s.research.completed.includes(c.id)||s.research.active.some(r=>r.id===c.id))throw new Error('研究は開始済みです');
  if(t.prerequisites.some(id=>!s.research.completed.includes(id)))throw new Error('前提研究が必要です');
  const points=researchPointCost(s,c.id);
  if(s.company.researchPoints<points)throw new Error(`研究ポイントが不足しています（必要 ${points}）`);
  s.company.researchPoints-=points;s.research.completed.push(c.id);logEvent(s,'researchComplete',t.label);return true;
 }
 if(c.type==='design'){
  requireRole(s,'engineering');
  if(s.products.length>=500)throw new Error('製品数の上限です');const def=hardwareCatalog[c.kind];
  for(const [key,field] of Object.entries(def.fields)){const v=c.spec[key];if(typeof v==='number'&&field.step&&field.min!==undefined&&Math.abs((v-field.min)/field.step-Math.round((v-field.min)/field.step))>1e-6)throw new Error(`${field.label}の刻みが不正です`);}const result=evaluateHardware(c.kind,c.spec,s.research.completed,{year:marketYear(s.day)});const tier=validateVisual(s.research.completed,c.kind,c.visual);
  assertProductPrice(c.price,{...result,kind:c.kind,unitCost:result.unitCost+visualFinishCost(tier),visual:c.visual},marketReference(c.kind,s.day));
  expense(s,developmentCost(c.kind,result.performance,s.day,def.designCost));s.products.push({id:`p-${s.products.length+1}`,name:c.name,kind:c.kind,spec:normalizeSpec(c.kind,c.spec),...(c.visual?{visual:c.visual}:{}),...result,unitCost:result.unitCost+visualFinishCost(tier),remaining:def.work/(1+techEffect(s.research.completed,c.kind,'capacity')),price:c.price,inventory:0,target:0,line:false,launched:false,sold:0,revenue:0,profit:0,releaseDay:0});logEvent(s,'designStarted',c.name);return true;
 }
 if(c.type==='launch'||c.type==='line'||c.type==='price'||c.type==='allocateStock'){
  const p=s.products.find(p=>p.id===c.id);if(!p)throw new Error('製品が存在しません');
  if(c.type==='launch'){if(p.remaining>0||p.launched)throw new Error('発売できません');p.launched=true;p.releaseDay=s.day;logEvent(s,'launched',p.name);launchReception(s,p,c.presentation??'none');}
  if(c.type==='line'){if(!p.launched||p.kind==='os')throw new Error('発売済みハードウェアを選択してください');p.target=c.target;p.line=c.target>0;}
  if(c.type==='price'){assertProductPrice(c.price,p,marketReference(p.kind,s.day));p.price=c.price;}
  if(c.type==='allocateStock'){if(p.kind==='os'||!p.launched)throw new Error('発売済みハードウェアを選択してください');p.stockAllocation={retail:c.retail,assembly:c.assembly,ai:c.ai};}
  return true;
 }
 return false;
}
export function manufacture(s:GameState){
 if(s.company.debt>0)return;
 const lines=s.products.filter(p=>p.line&&p.launched&&p.kind!=='os');let capacity=Math.floor(b.baseFactoryCapacity*s.factoryLevel*s.modifiers.production);
 for(let i=0;i<lines.length;i++){
  const p=lines[(i+s.day)%lines.length];const allocation=Math.ceil(capacity/(lines.length-i));
  const own=p.kind==='pc'||p.kind==='laptop'?deviceSlots.map(k=>s.products.find(part=>part.id===p.spec[k])).filter((part):part is typeof p=>!!part):[];
  const sourced=p.kind==='pc'||p.kind==='laptop'?deviceSlots.map(k=>s.rivals.filter(r=>!r.acquired).flatMap(r=>r.products.map(part=>({owner:r,part}))).find(x=>x.part.id===p.spec[k])).filter((x):x is NonNullable<typeof x>=>!!x):[];
  const device=p.kind==='pc'||p.kind==='laptop';
  const keys=deviceSlots;
  const missingAcquired=device&&s.rivals.some(r=>r.acquired&&r.products.some(part=>keys.some(k=>part.id===p.spec[k])));
  const generic=device?keys.reduce((n,k)=>n+(findVendorPart(String(p.spec[k]))?.unitCost??0),0):0;
  const cashCost=Math.max(1,device?assemblyOverhead(s,p)+generic+sourced.reduce((n,x)=>n+x.part.price,0):p.unitCost);
  const units=missingAcquired?0:Math.min(allocation,Math.max(0,p.target-p.inventory),Math.floor(s.company.cash/cashCost),...own.map(part=>availableForAssembly(part)),...sourced.map(x=>x.part.inventory));
  if(units>0){
   expense(s,units*cashCost);
   const transfers=own.reduce((n,part)=>n+removeStock(part,units),0);
   for(const x of sourced)settleProcurement(x.owner,x.part,units,s);
   addStock(p,units,units*cashCost+transfers);capacity-=units;
  }
 }
}
/** Weekly expected interest before inventory constraints and competition between own models of the same category. */
export function productDemandInterest(s:GameState,p:GameState['products'][number],variance=1){
 if(!p.launched)return 0;
 const def=productCatalog[p.kind];
  const quality=b.qualityFloor+s.company.reputation/100;const awareness=b.awarenessFloor+s.company.awareness/100;
  const value=Math.min(b.valueCeiling,p.performance/marketReference(p.kind,s.day))*((p.kind==='os'?b.osReferencePrice:p.unitCost*b.priceCostMultiple)/p.price)**b.priceElasticity;
  const age=Math.max(.08,Math.exp(-Math.max(0,s.day-p.releaseDay)/720));
  const demand=Math.floor(def.demand*value*quality*awareness*age*s.modifiers.demand*eraDemandFactor(p.kind,s.day)*(p.reliability/b.reliabilityBase)*visualDemandFactor(p.visual?.tier??0)*(1+(p.kind==='gpu'||p.spec.purpose==='server'?aiHardwareBoost(s):0))*competitorPressure(s,p.kind)*reviewDemandFactor(p)*fanDemandFactor(s)*(p.kind==='os'?osIncidentFactor(s):1)*distributionDemand(s)*hypeFactor(p)*(variance)*(s.difficulty==='hard'?b.hardDemand:1)*(s.mode==='tycoon'?b.tycoonDemand:1));
  return Math.max(0,demand);
}
/** Forecasted weekly units available to this one product after other owned models split category demand. */
export function productDemandForecast(s:GameState,p:GameState['products'][number]){
 if(!p.launched)return 0;
 const peers=s.products.filter(x=>x.launched&&x.kind===p.kind);
 const interests=peers.map(x=>productDemandInterest(s,x));
 const total=interests.reduce((a,b)=>a+b,0);
 return total?Math.floor(productDemandInterest(s,p)*Math.max(...interests)/total):0;
}
/** Direct calls keep weekly demand; passing 7 settles a daily share without inflating total volume. */
export function sellProducts(s:GameState,daysPerPeriod=1,openingInventory?:ReadonlyMap<string,number>){
 const candidates=s.products.filter(p=>p.launched).map(p=>{
  const [r,next]=nextRandom(s.seed);s.seed=next;
  return {p,demand:productDemandInterest(s,p,1-b.weeklyVariance/2+r*b.weeklyVariance)};
 });
 const pools=new Map<string,typeof candidates>();
 for(const candidate of candidates){const pool=pools.get(candidate.p.kind)??[];pool.push(candidate);pools.set(candidate.p.kind,pool);}
 for(const pool of pools.values()){
  const expectedBudget=Math.max(...pool.map(x=>x.demand))/daysPerPeriod;
  let budget=Math.floor(expectedBudget);
  if(daysPerPeriod>1){const [roll,next]=nextRandom(s.seed);s.seed=next;if(roll<expectedBudget-budget)budget++;}
  const total=pool.reduce((sum,x)=>sum+x.demand,0);
  const allocations=pool.map(x=>total?Math.floor(x.demand*budget/total):0);
  let unallocated=budget-allocations.reduce((sum,n)=>sum+n,0);
  const priority=pool.map((x,i)=>({i,remainder:total?x.demand*budget/total-allocations[i]:0})).sort((a,b)=>b.remainder-a.remainder||a.i-b.i);
  for(let i=0;i<unallocated;i++)allocations[priority[i%priority.length].i]++;
  for(let i=0;i<pool.length;i++){
   const p=pool[i].p;
   // Existing products retain legacy prioritization until a custom allocation is configured.
   const retailStock=p.stockAllocation||daysPerPeriod>1?availableForRetail(s,p,openingInventory?.get(p.id)??p.inventory):p.inventory;
   const units=Math.min(p.kind==='os'?Math.ceil(b.osWeeklyLimit/daysPerPeriod):retailStock,allocations[i]);
   if(units){
    const actualCost=p.kind==='os'?units*p.unitCost:removeStock(p,units);
    recordProductSale(s,p,units,p.price,actualCost);
    if(p.kind==='os')expense(s,units*p.unitCost,true);logEvent(s,'sales',`${p.name}: ${units}`);
    weeklyFans(s,p,units);
   }
   if(daysPerPeriod===1||s.day%7===0)decayHype(p);
  }
 }
}
export function researchAndDevelopment(s:GameState){
 s.company.researchPoints+=weeklyResearchPoints(s,b.researchPerWeek);
 if(hasRole(s,'research'))for(const r of s.research.active)r.remaining=Math.max(0,r.remaining-(b.researchPerWeek/founderProjects(s)+workBonus(s,'research'))/s.research.active.length);
 for(const r of s.research.active.filter(r=>r.remaining===0)){s.research.completed.push(r.id);logEvent(s,'researchComplete',techById.get(r.id)?.label??r.id);}
 s.research.active=s.research.active.filter(r=>r.remaining>0);
 const developing=s.products.filter(p=>p.remaining>0);
 if(hasRole(s,'engineering'))for(const p of developing){p.remaining=Math.max(0,p.remaining-(b.developmentPerWeek/founderProjects(s)+workBonus(s,'engineering'))/developing.length);if(p.remaining===0)logEvent(s,'designComplete',p.name);}
}

