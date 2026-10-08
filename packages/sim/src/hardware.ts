import {hardwareCatalog,hardwareBalance as b,capacityScaledFields,normalizeSpec,type Spec} from '../../content/src/hardware';
import {techById,type HardwareKind,techEffect} from '../../content/src/research';
import {expense,income,logEvent} from './finance';
import {nextRandom} from './random';
import {productCatalog,vendorParts,deviceSlots} from '../../content/src/devices';
import {assemblyOverhead} from './devices';
import {addStock,removeStock} from './inventory';
import {workBonus} from './management';
import {competitorPressure,settleProcurement} from './rivals';
import {assertProductPrice} from './pricing';
import {aiHardwareBoost,founderProjects} from './ai';
import {osIncidentFactor} from './os';
import {researchPointCost,weeklyResearchPoints,distributionDemand} from './business';
import {validateVisual,visualFinishCost,visualDemandFactor} from './visual';
import {launchReception,reviewDemandFactor,fanDemandFactor,hypeFactor,weeklyFans,decayHype} from './reception';
import type {GameState,GameCommand} from './types';
export function evaluateHardware(kind:HardwareKind,input:Spec,completed:string[]){
 const def=hardwareCatalog[kind];
 if(!completed.includes(`${kind}-compute-1`))throw new Error('基盤研究が必要です');
 const spec=normalizeSpec(kind,input);
 for(const [key,field]of Object.entries(def.fields)){
  const v=spec[key];
  if(field.options){if(typeof v!=='string'||!field.options.includes(v))throw new Error(`${field.label}が不正です`);}
  else if(typeof v!=='number'||!Number.isFinite(v)||v<field.min!||v>field.max!*(1+(capacityScaledFields.includes(key)?techEffect(completed,kind,'capacity'):0))||(field.step===1&&!Number.isInteger(v)))throw new Error(`${field.label}が不正です`);
 }
 const n=(k:string)=>Number(spec[k]);let performance=0,power=0,unitCost=0;
 switch(kind){
  case'cpu':performance=n('cores')*n('clock')*n('ipc')*b.cpu.scoreCoefficient*(n('cache')/b.cpu.cacheReference)**b.cpu.cacheExponent;power=n('cores')*n('clock')**2*n('process')/b.cpu.referenceProcess*b.cpu.powerCoefficient;unitCost=n('cores')*b.cpu.coreCost+n('clock')*b.cpu.clockCost+n('ipc')*b.cpu.ipcCost+(n('cache')-b.cpu.cacheReference)*b.cpu.cacheCost;break;
  case'gpu':performance=n('units')*n('clock')*b.gpu.scoreCoefficient*Math.min(1,n('bandwidth')/b.gpu.referenceBandwidth);power=n('units')*n('clock')**2*b.gpu.powerCoefficient;unitCost=n('units')*b.gpu.unitCost+n('vram')*b.gpu.vramCost+n('bandwidth')*b.gpu.bandwidthCost;break;
  case'motherboard':performance=n('slots')*b.motherboard.slotScore+n('features')*b.motherboard.featureScore;power=b.motherboard.basePower+n('features')*b.motherboard.featurePower;unitCost=b.motherboard.baseCost+n('slots')*b.motherboard.slotCost+n('features')*b.motherboard.featureCost;break;
  case'ram':performance=n('capacity')*n('speed')/b.ram.scoreDivisor;power=n('capacity')*b.ram.powerCoefficient;unitCost=n('capacity')*b.ram.capacityCost+n('speed')*b.ram.speedCost;break;
  case'storage':performance=n('capacity')*b.storage.capacityScore+n('speed')*b.storage.speedScore;power=n('speed')*b.storage.powerCoefficient;unitCost=n('capacity')*b.storage.capacityCost+n('speed')*b.storage.speedCost;break;
  case'psu':{const m=String(spec.modular) as 'none'|'semi'|'full';performance=n('wattage')*n('efficiency')/100*b.psu.modularScore[m];power=n('wattage')*(1-n('efficiency')/100)*b.psu.lossCoefficient;unitCost=n('wattage')*b.psu.wattageCost+(n('efficiency')-b.psu.efficiencyBase)*b.psu.efficiencyCost+b.psu.modularCost[m];break;}
  case'monitor':performance=n('resolution')*n('refresh')*n('gamut')*b.monitor.scoreCoefficient;power=n('resolution')*b.monitor.powerCoefficient;unitCost=n('resolution')*b.monitor.resolutionCost+n('refresh')*b.monitor.refreshCost+n('gamut')*b.monitor.gamutCost;break;
 }
 performance*=1+Math.max(0,techEffect(completed,kind,'compute')-b.rootComputeBonus);
 performance*=1+techEffect(completed,kind,'compatibility');power*=Math.exp(-techEffect(completed,kind,'power'));unitCost*=Math.exp(-techEffect(completed,kind,'cost')*b.costResearchScale);
 return{performance:Math.round(performance),power:Math.round(power),unitCost:Math.max(1,Math.round(unitCost)),reliability:b.reliabilityBase+b.reliabilityGain*(1-Math.exp(-techEffect(completed,kind,'reliability')))};
}
export function hardwareCommand(s:GameState,c:GameCommand):boolean{
 if(c.type==='research'){
  const t=techById.get(c.id);if(!t)throw new Error('研究が存在しません');
  if(s.research.completed.includes(c.id)||s.research.active.some(r=>r.id===c.id))throw new Error('研究は開始済みです');
  if(t.prerequisites.some(id=>!s.research.completed.includes(id)))throw new Error('前提研究が必要です');
  const points=researchPointCost(s,c.id);
  if(s.company.researchPoints<points)throw new Error(`研究ポイントが不足しています（必要 ${points}）`);
  s.company.researchPoints-=points;s.research.completed.push(c.id);logEvent(s,'researchComplete',t.label);return true;
 }
 if(c.type==='design'){
  if(s.products.length>=500)throw new Error('製品数の上限です');const def=hardwareCatalog[c.kind];
  for(const [key,field] of Object.entries(def.fields)){const v=c.spec[key];if(typeof v==='number'&&field.step&&field.min!==undefined&&Math.abs((v-field.min)/field.step-Math.round((v-field.min)/field.step))>1e-6)throw new Error(`${field.label}の刻みが不正です`);}const result=evaluateHardware(c.kind,c.spec,s.research.completed);const tier=validateVisual(s.research.completed,c.kind,c.visual);
  assertProductPrice(c.price,{...result,kind:c.kind,unitCost:result.unitCost+visualFinishCost(tier),visual:c.visual});
  expense(s,def.designCost);s.products.push({id:`p-${s.products.length+1}`,name:c.name,kind:c.kind,spec:normalizeSpec(c.kind,c.spec),...(c.visual?{visual:c.visual}:{}),...result,unitCost:result.unitCost+visualFinishCost(tier),remaining:def.work/(1+techEffect(s.research.completed,c.kind,'capacity')),price:c.price,inventory:0,target:0,line:false,launched:false,sold:0,revenue:0,profit:0,releaseDay:0});logEvent(s,'designStarted',c.name);return true;
 }
 if(c.type==='launch'||c.type==='line'||c.type==='price'){
  const p=s.products.find(p=>p.id===c.id);if(!p)throw new Error('製品が存在しません');
  if(c.type==='launch'){if(p.remaining>0||p.launched)throw new Error('発売できません');p.launched=true;p.releaseDay=s.day;logEvent(s,'launched',p.name);launchReception(s,p,c.presentation??'none');}
  if(c.type==='line'){if(!p.launched||p.kind==='os')throw new Error('発売済みハードウェアを選択してください');p.target=c.target;p.line=c.target>0;}
  if(c.type==='price'){assertProductPrice(c.price,p);p.price=c.price;}
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
  const generic=device?keys.reduce((n,k)=>n+(vendorParts.find(part=>part.id===p.spec[k])?.unitCost??0),0):0;
  const cashCost=Math.max(1,device?assemblyOverhead(s,p)+generic+sourced.reduce((n,x)=>n+x.part.price,0):p.unitCost);
  const units=missingAcquired?0:Math.min(allocation,Math.max(0,p.target-p.inventory),Math.floor(s.company.cash/cashCost),...own.map(part=>part.inventory),...sourced.map(x=>x.part.inventory));
  if(units>0){
   expense(s,units*cashCost);
   const transfers=own.reduce((n,part)=>n+removeStock(part,units),0);
   for(const x of sourced)settleProcurement(x.owner,x.part,units);
   addStock(p,units,units*cashCost+transfers);capacity-=units;
  }
 }
}
export function sellProducts(s:GameState){
 for(const p of s.products.filter(p=>p.launched)){
  const [r,next]=nextRandom(s.seed);s.seed=next;const def=productCatalog[p.kind];
  const quality=b.qualityFloor+s.company.reputation/100;const awareness=b.awarenessFloor+s.company.awareness/100;
  const value=Math.min(b.valueCeiling,p.performance/def.reference)*((p.kind==='os'?b.osReferencePrice:p.unitCost*b.priceCostMultiple)/p.price)**b.priceElasticity;
  const age=Math.max(b.minimumAgeFactor,1-(s.day-p.releaseDay)/b.ageDecay);
  const demand=Math.floor(def.demand*value*quality*awareness*age*s.modifiers.demand*(p.reliability/b.reliabilityBase)*visualDemandFactor(p.visual?.tier??0)*(1+(p.kind==='gpu'||p.spec.purpose==='server'?aiHardwareBoost(s):0))*competitorPressure(s,p.kind)*reviewDemandFactor(p)*fanDemandFactor(s)*(p.kind==='os'?osIncidentFactor(s):1)*distributionDemand(s)*hypeFactor(p)*(1-b.weeklyVariance/2+r*b.weeklyVariance)*(s.difficulty==='hard'?b.hardDemand:1)*(s.mode==='tycoon'?b.tycoonDemand:1));
  const units=Math.min(p.kind==='os'?b.osWeeklyLimit:p.inventory,Math.max(0,demand));
  if(units){
   const actualCost=p.kind==='os'?units*p.unitCost:removeStock(p,units);p.sold+=units;
   const bundled=p.spec.osId?s.products.find(os=>os.id===p.spec.osId&&os.kind==='os'):undefined;
   const license=bundled?Math.min(p.price,bundled.price):0;
   p.revenue+=units*(p.price-license);p.profit+=units*(p.price-license+(bundled?.unitCost??0))-actualCost;
   if(bundled){bundled.sold+=units;bundled.revenue+=units*license;bundled.profit+=units*(license-bundled.unitCost);}
   income(s,units*p.price);if(p.kind==='os')expense(s,units*p.unitCost,true);logEvent(s,'sales',`${p.name}: ${units}`);
   weeklyFans(s,p,units);
  }
  decayHype(p);
 }
}
export function researchAndDevelopment(s:GameState){
 s.company.researchPoints+=weeklyResearchPoints(s,b.researchPerWeek);
 for(const r of s.research.active)r.remaining=Math.max(0,r.remaining-(b.researchPerWeek/founderProjects(s)+workBonus(s,'research'))/s.research.active.length);
 for(const r of s.research.active.filter(r=>r.remaining===0)){s.research.completed.push(r.id);logEvent(s,'researchComplete',techById.get(r.id)?.label??r.id);}
 s.research.active=s.research.active.filter(r=>r.remaining>0);
 const developing=s.products.filter(p=>p.remaining>0);
 for(const p of developing){p.remaining=Math.max(0,p.remaining-(b.developmentPerWeek/founderProjects(s)+workBonus(s,'engineering'))/developing.length);if(p.remaining===0)logEvent(s,'designComplete',p.name);}
}
