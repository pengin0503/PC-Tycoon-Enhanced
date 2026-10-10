import {hardwareCatalog,hardwareBalance as b,normalizeSpec,fieldRange,fieldOptions,fieldGrowth,coolingReliability,processPowerFactor,processCostFactor,hardwareTechYear,type Spec} from '../../content/src/hardware';
import {type HardwareKind} from '../../content/src/research';
import {techById} from '../../content/src/tech-catalog';
import {expense,logEvent} from './finance';
import {nextRandom} from './random';
import {productCatalog,deviceSlots} from '../../content/src/devices';
import {assemblyOverhead} from './devices';
import {findVendorPart} from './vendor-market';
import {addStock,removeStock} from './inventory';
import {workBonus} from './management';
import {competitorPressure,settleProcurement,onSale} from './rivals';
import {assertProductPrice} from './pricing';
import {aiHardwareBoost,founderProjects} from './ai';
import {osIncidentFactor} from './os';
import {researchPointCost,weeklyResearchPoints,distributionDemand,requireRole,hasRole} from './business';
import {validateVisual,visualFinishCost,visualDemandFactor} from './visual';
import {launchReception,reviewDemandFactor,fanDemandFactor,hypeFactor,weeklyFans,decayHype} from './reception';
import {recordProductSale} from './sales';
import {availableForRetail,availableForAssembly} from './inventory-allocation';
import {marketReference} from './market';
import {developmentCost} from './development-cost';
import {eraDemandFactor} from './events';
import {industrySockets,isIndustrySocket,socketBoardCost,type SocketSpec} from '../../content/src/sockets';
import {companySockets,developSockets} from './sockets';
import type {GameState,GameCommand} from './types';
/** Performance score of a component specification (no research or validation involved). */
export function hardwarePerformance(kind:HardwareKind,spec:Spec){
 const n=(k:string)=>Number(spec[k]);
 const or=(k:string,fallback:number)=>spec[k]===undefined?fallback:n(k);
 switch(kind){
  case'cpu':{
   const cache=spec.l1Cache===undefined?n('cache'):n('l1Cache')+n('l2Cache')+n('l3Cache');
   return n('cores')*n('clock')*n('ipc')*b.cpu.scoreCoefficient*(cache/b.cpu.cacheReference)**b.cpu.cacheExponent*
    (spec.smt==='on'?1.18:1)*(1+.035*(or('memoryChannels',1)-1));
  }
  case'gpu':{const ops=n('units')*n('clock');return ops*b.gpu.scoreCoefficient*Math.min(1,n('bandwidth')/(ops*b.gpu.bandwidthPerOp))*Math.min(1,or('busWidth',64)/64);}
  case'motherboard':{
   const m=b.motherboard;
   // Boards saved before the split specification kept one merged "features" count.
   const io=spec.features!==undefined?n('features')*m.featureScore:or('usb',2)*m.usbScore+or('storagePorts',4)*m.portScore+m.lanScore*Math.log10(1+or('lan',100)/10);
   return (n('slots')*m.slotScore+io)*(n('bus')/m.busReference)**m.busExponent;
  }
  case'ram':return n('capacity')*n('speed')/b.ram.scoreDivisor*(7/or('latency',7))**.15;
  case'storage':{const write=or('writeSpeed',n('speed'));return Math.sqrt(n('capacity')*n('speed')**b.storage.readWeight*write**(1-b.storage.readWeight))*b.storage.scoreCoefficient*(or('iops',100)/100)**.1;}
  case'psu':return n('wattage')*n('efficiency')/100*b.psu.modularScore[String(spec.modular) as 'none'|'semi'|'full'];
  case'monitor':{
   const m=b.monitor;
   return n('resolution')*n('refresh')*n('gamut')*m.scoreCoefficient*(or('size',m.referenceSize)/m.referenceSize)**.3*(m.panelScore[String(spec.panel??'TN')]??1)*
    (m.referenceResponse/or('response',m.referenceResponse))**.08*(or('brightness',m.referenceBrightness)/m.referenceBrightness)**.15;
  }
 }
}
/**
 * Metrics of a component design. New designs must stay inside the research-unlocked slider ranges and options and
 * need cooling at least equal to their power draw. `stored` re-checks an already designed (possibly older) product:
 * its values were accepted under the rules of its time, so research ranges and cooling are not re-applied.
 * Manufacturing cost follows the company's technology (see `hardwareBalance`): CPU/GPU logic is priced per process node
 * and node maturity, other values relative to how far research has moved their frontier. Performance and power use
 * the designed values. `sockets`: the sockets the company may design for (the industry sockets by default); a new CPU
 * must fit its socket's power delivery and memory channels, and a motherboard pays for a company socket stronger than Atlas.
 */
export function evaluateHardware(kind:HardwareKind,input:Spec,completed:readonly string[],{stored=false,sockets=industrySockets}:{stored?:boolean,sockets?:readonly SocketSpec[]}={}){
 const def=hardwareCatalog[kind];
 if(!completed.includes(`${kind}-compute-1`))throw new Error('基盤研究が必要です');
 if(!stored&&'cooling' in def.fields&&input.cooling===undefined)throw new Error('冷却性能を指定してください');
 const spec=normalizeSpec(kind,input);
 for(const [key,field]of Object.entries(def.fields)){
  const v=spec[key];
  if(v===undefined)continue;
  if(field.legacy&&!stored)throw new Error(`${field.label}は旧データ専用の項目です`);
  if(key==='socket'){
   // Stored products may use sockets of acquired or older companies; new designs need one of the company's sockets.
   if(typeof v!=='string'||!v||(!stored&&!sockets.some(x=>x.name===v)))throw new Error(`${field.label}「${String(v)}」は使用できません`);continue;}
  if(field.options){if(typeof v!=='string'||!field.options.includes(v))throw new Error(`${field.label}が不正です`);
   if(!stored&&!fieldOptions(kind,key,completed).includes(v))throw new Error(`${field.label}「${field.optionLabels?.[v]??v}」は研究が必要です`);continue;}
  if(typeof v!=='number'||!Number.isFinite(v)||v<0||(field.step===1&&!Number.isInteger(v)))throw new Error(`${field.label}が不正です`);
  if(stored)continue;
  if(field.values&&!field.values.some(x=>Math.abs(x-v)<1e-9))throw new Error(`${field.label}が不正です`);
  const range=fieldRange(kind,key,completed);
  if(v<range.min-1e-9||v>range.max+1e-9){
   const unit=field.unit??'';
   throw new Error(v<Number(field.min)||v>Number(field.max)?`${field.label}が不正です`:`${field.label}は現在の研究では${range.min}～${range.max}${unit}の範囲で設計できます`);
  }
 }
 const n=(k:string)=>Number(spec[k]);
 const g=(k:string)=>fieldGrowth(kind,k,completed);
 /** Value in power-efficiency terms: divided by the whole frontier growth (newer technology, less energy). */
 const e=(k:string)=>n(k)/g(k);
 /** Value in production-cost terms: the frontier growth discounts all but `frontierCost` of the value. */
 const cv=(k:string,frontierCost:number)=>n(k)/g(k)**(1-frontierCost);
 /** Improvement of a lower-is-better value over `reference`, in production-cost terms (1 = no premium). */
 const lowerCv=(k:string,reference:number,frontierCost:number)=>reference/n(k)/g(k)**(1-frontierCost);
 const node=()=>processCostFactor(n('process'),fieldRange(kind,'process',completed).min);
 // CPUs saved before L1/L2/L3 were split keep one total cache size.
 const legacyCache=kind==='cpu'&&input.l1Cache===undefined&&input.l2Cache===undefined&&input.l3Cache===undefined;
 const legacyCacheSize=Number(input.cache??def.fields.cache?.legacyDefault);
 const performance=hardwarePerformance(kind,legacyCache?{...Object.fromEntries(Object.entries(spec).filter(([k])=>!k.startsWith('l')||!k.endsWith('Cache'))),cache:legacyCacheSize}:spec);let power=0,unitCost=0;
 switch(kind){
  case'cpu':{const c=b.cpu;
   power=n('cores')*n('clock')*processPowerFactor(n('process'))*c.powerCoefficient*(spec.smt==='on'?1.1:1);
   const logic=n('cores')*n('ipc')**c.ipcCostExponent*(1+c.clockArea*n('clock'))*(spec.smt==='on'?c.smtArea:1);
   const cache=legacyCache?legacyCacheSize:n('l1Cache')+n('l2Cache')+n('l3Cache');
   unitCost=c.baseCost+(logic*c.coreCost+cache*c.cacheCost)*node()+Math.max(0,cv('memoryChannels',c.frontierCost)-1)*c.channelCost;break;}
  case'gpu':{const c=b.gpu;
   power=n('units')**c.unitsPowerExponent*n('clock')*processPowerFactor(n('process'))*c.powerCoefficient;
   unitCost=c.baseCost+(n('units')*(1+c.clockArea*n('clock'))*c.unitCost+n('busWidth')/64*c.busCost)*node()+cv('vram',c.frontierCost)*c.vramCost+cv('bandwidth',c.frontierCost)*c.bandwidthCost;break;}
  case'motherboard':{const m=b.motherboard;
   const legacy=spec.features!==undefined;
   power=m.basePower+(legacy?n('features')*m.featurePower:n('usb')*m.usbPower+n('storagePorts')*m.portPower+Math.sqrt(e('lan'))*m.lanPower*10);
   unitCost=m.baseCost+n('slots')*m.slotCost+(legacy?n('features')*m.featureCost:cv('usb',m.frontierCost)*m.usbCost+cv('storagePorts',m.frontierCost)*m.portCost+cv('lan',m.frontierCost)*m.lanCost)+cv('bus',m.frontierCost)*m.busCost;break;}
  case'ram':{const r=b.ram;
   power=r.basePower+e('capacity')*r.powerCoefficient;
   unitCost=r.baseCost+cv('capacity',r.frontierCost)*r.capacityCost+cv('speed',r.frontierCost)*r.speedCost+Math.max(0,1-1/lowerCv('latency',7,r.frontierCost))*7*r.latencyCost;break;}
  case'storage':{const t=b.storage;
   power=t.basePower+e('speed')*t.speedPower;
   unitCost=t.baseCost+cv('capacity',t.frontierCost)*t.capacityCost+cv('speed',t.frontierCost)*t.speedCost+cv('writeSpeed',t.frontierCost)*t.writeCost+Math.max(0,cv('iops',t.frontierCost)-100)*t.iopsCost;break;}
  case'psu':{const q=b.psu;const m=String(spec.modular) as 'none'|'semi'|'full';
   power=n('wattage')*(1-n('efficiency')/100)*q.lossCoefficient;
   unitCost=q.baseCost+cv('wattage',q.frontierCost)*q.wattageCost+Math.max(0,n('efficiency')-q.efficiencyBase)*q.efficiencyCost/g('efficiency')**(1-q.frontierCost)+q.modularCost[m];break;}
  case'monitor':{const m=b.monitor;const panel=String(spec.panel);
   const sizeRatio=n('size')/m.referenceSize;
   power=e('resolution')*m.powerCoefficient*e('refresh')/m.referenceRefresh*sizeRatio**1.2*(Math.max(e('brightness'),m.referenceBrightness)/m.referenceBrightness)**.7*(m.panelPower[panel]??1);
   const panelYear=hardwareCatalog.monitor.fields.panel.optionUnlock?.years[panel]??2000;
   // A panel type matures as the display industry's technology moves past its introduction year.
   const panelAge=Math.max(0,hardwareTechYear('monitor',completed)-panelYear);
   unitCost=m.baseCost+n('size')**2/g('size')**(1-m.frontierCost)*m.sizeCost+cv('resolution',m.frontierCost)*m.resolutionCost+cv('refresh',m.frontierCost)*m.refreshCost+n('gamut')*m.gamutCost+
    (m.panelCost[panel]??0)*Math.max(m.panelMatureShare,1-panelAge/m.panelMaturityYears)+Math.max(0,lowerCv('response',m.referenceResponse,m.frontierCost)-1)*m.responseCost+cv('brightness',m.frontierCost)*m.brightnessCost;break;}
 }
 const cooling='cooling' in def.fields?n('cooling'):undefined;
 if(cooling!==undefined)unitCost+=cv('cooling',b.cooling.frontierCost)*(b.cooling.cost[kind]??0);
 const socket=spec.socket===undefined?undefined:[...sockets,...industrySockets].find(x=>x.name===spec.socket);
 if(kind==='motherboard'&&socket&&!isIndustrySocket(socket.name))unitCost+=socketBoardCost(socket);
 power=Math.round(power);
 if(cooling!==undefined&&!stored&&power>cooling)throw new Error(`冷却性能が不足しています（消費電力 ${power}W / 冷却性能 ${cooling}W）`);
 if(kind==='cpu'&&socket&&!stored){
  if(power>socket.power)throw new Error(`ソケット「${socket.name}」の電力供給を超えています（消費電力 ${power}W / 上限 ${socket.power}W）`);
  if(n('memoryChannels')>socket.channels)throw new Error(`ソケット「${socket.name}」のメモリチャネル数を超えています（${n('memoryChannels')}ch / 上限 ${socket.channels}ch）`);
 }
 const reliability=b.reliabilityBase+(cooling?coolingReliability(power,cooling):0);
 return{performance:Math.max(1,Math.round(performance)),power,unitCost:Math.max(1,Math.round(unitCost)),reliability:Math.min(1,reliability)};
}
/** Completes one technology for its research points (needs a research employee and every prerequisite). */
function research(s:GameState,id:string){
 const t=techById.get(id);if(!t)throw new Error('研究が存在しません');
 requireRole(s,'research');
 if(s.research.completed.includes(id)||s.research.active.some(r=>r.id===id))throw new Error('研究は開始済みです');
 if(t.prerequisites.some(p=>!s.research.completed.includes(p)))throw new Error('前提研究が必要です');
 const points=researchPointCost(s,id);
 if(s.company.researchPoints<points)throw new Error(`研究ポイントが不足しています（必要 ${points}）`);
 s.company.researchPoints-=points;s.research.completed.push(id);logEvent(s,'researchComplete',t.label);
}
/** Next stage of a research branch (`${category}-${axis}-N`), or undefined when the branch is complete. */
export function nextStage(completed:readonly string[],category:string,axis:string){
 let level=0;while(completed.includes(`${category}-${axis}-${level+1}`))level++;
 return techById.get(`${category}-${axis}-${level+1}`);
}
export function hardwareCommand(s:GameState,c:GameCommand):boolean{
 if(c.type==='research'){research(s,c.id);return true;}
 if(c.type==='researchBranch'){
  // Several stages of one branch in order; each stage is checked and paid like a single research, and any failure
  // rejects the whole command.
  for(let i=0;i<c.stages;i++){
   const t=nextStage(s.research.completed,c.category,c.axis);if(!t)throw new Error('この系統は最後の段階まで研究済みです');
   research(s,t.id);
  }
  return true;
 }
 if(c.type==='design'){
  requireRole(s,'engineering');
  if(s.products.length>=500)throw new Error('製品数の上限です');const def=hardwareCatalog[c.kind];
  for(const [key,field] of Object.entries(def.fields)){const v=c.spec[key];if(typeof v==='number'&&field.step&&field.min!==undefined&&Math.abs((v-field.min)/field.step-Math.round((v-field.min)/field.step))>1e-6)throw new Error(`${field.label}の刻みが不正です`);}const result=evaluateHardware(c.kind,c.spec,s.research.completed,{sockets:companySockets(s)});const tier=validateVisual(s.research.completed,c.kind,c.visual);
  assertProductPrice(c.price,{...result,kind:c.kind,unitCost:result.unitCost+visualFinishCost(tier),visual:c.visual},marketReference(c.kind,s.day));
  expense(s,developmentCost(c.kind,result.performance,s.day,def.designCost));s.products.push({id:`p-${s.products.length+1}`,name:c.name,kind:c.kind,spec:normalizeSpec(c.kind,c.spec),...(c.visual?{visual:c.visual}:{}),...result,unitCost:result.unitCost+visualFinishCost(tier),remaining:def.work,price:c.price,inventory:0,target:0,line:false,launched:false,sold:0,revenue:0,profit:0,releaseDay:0});logEvent(s,'designStarted',c.name);return true;
 }
 if(c.type==='launch'||c.type==='line'||c.type==='price'||c.type==='allocateStock'||c.type==='discontinue'){
  const p=s.products.find(p=>p.id===c.id);if(!p)throw new Error('製品が存在しません');
  if(c.type!=='launch'&&p.discontinuedDay!==undefined)throw new Error('販売終了した製品です');
  if(c.type==='discontinue'){discontinue(s,p);return true;}
  if(c.type==='launch'){if(p.remaining>0||p.launched)throw new Error('発売できません');p.launched=true;p.releaseDay=s.day;logEvent(s,'launched',p.name);launchReception(s,p,c.presentation??'none');}
  if(c.type==='line'){if(!p.launched||p.kind==='os')throw new Error('発売済みハードウェアを選択してください');p.target=c.target;p.line=c.target>0;}
  if(c.type==='price'){assertProductPrice(c.price,p,marketReference(p.kind,s.day));p.price=c.price;}
  if(c.type==='allocateStock'){if(p.kind==='os'||!p.launched)throw new Error('発売済みハードウェアを選択してください');p.stockAllocation={retail:c.retail,assembly:c.assembly,ai:c.ai};}
  return true;
 }
 return false;
}
/**
 * Ends sales of a launched product: production stops, pending bulk offers for it are withdrawn and the stock retail
 * could sell is cleared at `hardwareBalance.clearanceShare` of the price. Stock reserved for the company's own PC
 * assembly or AI clusters stays usable. The product keeps its record and is no longer offered or produced.
 */
export function discontinue(s:GameState,p:GameState['products'][number]){
 if(!p.launched)throw new Error('発売済みの製品を選択してください');
 const clearance=p.kind==='os'?0:availableForRetail(s,p);
 p.line=false;p.target=0;p.discontinuedDay=s.day;delete p.hype;
 s.offers=s.offers.filter(o=>o.productId!==p.id);
 if(clearance>0){const price=Math.max(1,Math.round(p.price*b.clearanceShare));recordProductSale(s,p,clearance,price,removeStock(p,clearance));}
 logEvent(s,'discontinued',clearance?`${p.name}（在庫 ${clearance.toLocaleString('ja-JP')}台を処分）`:p.name);
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
 if(!onSale(p))return 0;
 const def=productCatalog[p.kind];
  const quality=b.qualityFloor+s.company.reputation/100;const awareness=b.awarenessFloor+s.company.awareness/100;
  const value=Math.min(b.valueCeiling,p.performance/marketReference(p.kind,s.day))*((p.kind==='os'?b.osReferencePrice:p.unitCost*b.priceCostMultiple)/p.price)**b.priceElasticity;
  const age=Math.max(.08,Math.exp(-Math.max(0,s.day-p.releaseDay)/720));
  const demand=Math.floor(def.demand*value*quality*awareness*age*s.modifiers.demand*eraDemandFactor(p.kind,s.day)*(p.reliability/b.reliabilityBase)*visualDemandFactor(p.visual?.tier??0)*(1+(p.kind==='gpu'||p.spec.purpose==='server'?aiHardwareBoost(s):0))*competitorPressure(s,p.kind)*reviewDemandFactor(p)*fanDemandFactor(s)*(p.kind==='os'?osIncidentFactor(s):1)*distributionDemand(s)*hypeFactor(p)*(variance)*(s.difficulty==='hard'?b.hardDemand:1)*(s.mode==='tycoon'?b.tycoonDemand:1));
  return Math.max(0,demand);
}
/** Forecasted weekly units available to this one product after other owned models split category demand. */
export function productDemandForecast(s:GameState,p:GameState['products'][number]){
 if(!onSale(p))return 0;
 const peers=s.products.filter(x=>onSale(x)&&x.kind===p.kind);
 const interests=peers.map(x=>productDemandInterest(s,x));
 const total=interests.reduce((a,b)=>a+b,0);
 return total?Math.floor(productDemandInterest(s,p)*Math.max(...interests)/total):0;
}
/** Direct calls keep weekly demand; passing 7 settles a daily share without inflating total volume. */
export function sellProducts(s:GameState,daysPerPeriod=1,openingInventory?:ReadonlyMap<string,number>){
 const candidates=s.products.filter(onSale).map(p=>{
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
 // Products and sockets in development share the engineers' weekly work.
 const developing=[...s.products.filter(p=>p.remaining>0),...developSockets(s)];
 if(hasRole(s,'engineering'))for(const p of developing){p.remaining=Math.max(0,p.remaining-(b.developmentPerWeek/founderProjects(s)+workBonus(s,'engineering'))/developing.length);if(p.remaining===0)logEvent(s,'kind' in p?'designComplete':'socketComplete',p.name);}
}

