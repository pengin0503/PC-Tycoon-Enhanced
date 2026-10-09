import {deviceSlots,deviceBalance as b,deviceCooling,deviceCoolingCost} from '../../content/src/devices';
import {findVendorPart} from './vendor-market';
import type {GameState,GameCommand,Product} from './types';
import {expense,logEvent} from './finance';
import {requireRole} from './business';
import {developmentCost} from './development-cost';
import {hardwareBalance,coolingReliability} from '../../content/src/hardware';
import {unlockedRange,unlockProgress,frontierGrowth} from '../../content/src/unlocks';
import {marketReference} from './market';
import {techEffect} from '../../content/src/research';
import {validateVisual,visualFinishCost} from './visual';
import {assertProductPrice} from './pricing';
import {osRequirements,meetsOSRequirements} from './os';
import {osBalance,osFeatureResearch,osFeatureLabels,osSliders,type OSFeature,type OSSlider} from '../../content/src/os';
/** Production overhead is fixed at design time, excluding separately sourced components. */
export function assemblyOverhead(s:GameState,p:Product):number{
 if(typeof p.spec.assemblyOverhead==='number')return Number(p.spec.assemblyOverhead);
 const ids=deviceSlots;
 const own=ids.reduce((n,k)=>n+(s.products.find(part=>part.id===p.spec[k])?.unitCost??0),0);
 const generic=ids.reduce((n,k)=>n+(findVendorPart(String(p.spec[k]))?.unitCost??0),0);
 return Math.max(1,p.unitCost-own-generic-Number(p.spec.procurementCost??0));
}

/** Own, generic vendor or (unless acquired, when not `allowLegacy`) launched rival part by id. */
export function findPart(s:GameState,id:string|undefined,allowLegacy=false){
 if(id===undefined)return undefined;
 return s.products.find(p=>p.id===id)??findVendorPart(id)??s.rivals.flatMap(r=>(allowLegacy||!r.acquired)?r.products.filter(p=>p.launched):[]).find(p=>p.id===id);
}
/** Parts referenced by a PC/laptop spec; the optional PSU slot is included only when present. */
export function deviceParts(spec:Record<string,string|number>):Partial<Record<typeof deviceSlots[number],string>>{
 return Object.fromEntries(deviceSlots.filter(k=>spec[k]!==undefined).map(k=>[k,String(spec[k])]));
}
/** Why a case cooling choice cannot be built (research range or insufficient for the power draw), or '' when it can. */
export function deviceCoolingProblem(s:GameState,kind:'pc'|'laptop',power:number,cooling:number|undefined){
 if(cooling===undefined)return '冷却性能を指定してください';
 const range=unlockedRange(deviceCooling[kind],kind,s.research.completed);
 if(!Number.isInteger(cooling)||cooling<range.min||cooling>range.max)return `冷却性能は現在の研究では${range.min}～${range.max}Wの範囲で設計できます`;
 if(power>cooling)return `冷却性能が不足しています（消費電力 ${power}W / 冷却性能 ${cooling}W）`;
 return '';
}
/**
 * Metrics of a PC/laptop build. `cooling` (W) must cover the parts' power draw and stay inside the research-unlocked
 * range; it may be omitted only for stored (`allowLegacy`) products designed before cooling existed.
 * `previewOnly` returns metrics without the cooling check so the designer can show why a draft is blocked.
 */
export function evaluateDevice(s:GameState,parts:Partial<Record<string,string>>,purpose:'gaming'|'office'|'server',kind:'pc'|'laptop',osId?:string,allowLegacy=false,cooling?:number,previewOnly=false){
 const rivals=s.rivals.flatMap(r=>r.products.map(p=>({part:p,owner:r})));
 const resolve=(k:string)=>{const p=findPart(s,parts[k],allowLegacy);
  if(!p||p.kind!==k||('remaining'in p&&p.remaining>0))throw new Error('利用可能な部品を選択してください');return p;};
 const resolved=(['cpu','gpu','motherboard','ram','storage'] as const).map(resolve);
 const [cpu,gpu,board,ram,storage]=resolved;
 // Stored builds were accepted when designed (older saves may reference parts whose generic specs were updated since).
 if(!allowLegacy&&(cpu.spec.socket!==board.spec.socket||ram.spec.memoryGen!==board.spec.memoryGen))throw new Error('ソケットまたはメモリ世代が非互換です');
 const psu=parts.psu===undefined?undefined:resolve('psu');
 const draw=resolved.reduce((n,p)=>n+p.power,0);
 if(psu&&Number(psu.spec.wattage)<draw*hardwareBalance.psu.headroom)throw new Error(`電源の定格出力が不足しています（必要 ${Math.ceil(draw*hardwareBalance.psu.headroom)}W 以上）`);
 const psuReliability=psu?(Number(psu.spec.efficiency)-hardwareBalance.psu.efficiencyBase)*hardwareBalance.psu.reliabilityPerEfficiency:0;
 const priced=psu?[...resolved,psu]:resolved;
 const os=osId?s.products.find(p=>p.id===osId&&p.kind==='os'&&p.launched):undefined;if(osId&&!os)throw new Error('発売済みOSが必要です');
 const factors=[cpu,gpu,ram,storage].map((p,i)=>p.performance/b.referencePerformance[i]);
 // Weighted geometric mean: one part from a far later era cannot carry the whole machine.
 const score=factors.reduce((n,x,i)=>n*Math.max(1e-6,x)**b.purposeWeights[purpose][i],1)*b.scoreScale;
 const unmet=os&&!meetsOSRequirements(s,parts as Record<string,string>,osRequirements(os))?osBalance.unmetPerformance:1;
 const osFactor=os?(b.os.baseCompatibility+Number(os.spec.compatibility)*b.os.compatibilityWeight)*(b.os.qualityFloor+Number(os.spec.quality)*b.os.qualityWeight)*unmet:b.os.withoutOS;
 const e=(axis:string)=>techEffect(s.research.completed,kind,axis);
 // Compute/compatibility research widen the cooling range instead of multiplying performance.
 // The PSU's conversion loss is heat inside the case, so it counts toward the power the cooling must cover.
 const power=Math.round((draw+(psu?.power??0))*Math.exp(-e('power')));
 if(!allowLegacy&&!previewOnly){const problem=deviceCoolingProblem(s,kind,power,cooling);if(problem)throw new Error(problem);}
 // Case cooling is part of the case overhead, so cost research discounts it like the CPU/GPU cooler cost.
 // Case cooling is priced in production terms: research that widens the cooling range also makes each W cheaper.
 const overhead=b.caseCost+(kind==='laptop'?b.laptopPackaging:0)+(cooling===undefined?0:cooling/frontierGrowth(deviceCooling[kind],unlockProgress(s.research.completed,kind,deviceCooling[kind].unlock.axes))*deviceCoolingCost[kind]);
 return {reliability:Math.min(1,hardwareBalance.reliabilityBase+hardwareBalance.reliabilityGain*(1-Math.exp(-e('reliability')))+psuReliability+(cooling?coolingReliability(power,cooling):0)),performance:Math.round(score*osFactor*(kind==='laptop'?b.laptopCooling:1)),power,unitCost:priced.reduce((n,p)=>n+(rivals.find(x=>x.part.id===p.id)?.part.price??p.unitCost),0)+Math.round(overhead*Math.exp(-e('cost')*b.packagingResearchScale))+(os?os.unitCost:0)};
}
export function appendProduct(s:GameState,data:Pick<Product,'name'|'kind'|'spec'|'price'|'performance'|'power'|'unitCost'> & {reliability?:number,visual?:Product['visual']},work:number){
 if(s.products.length>=500)throw new Error('製品数の上限です');
 s.products.push({...data,reliability:data.reliability??hardwareBalance.reliabilityBase,id:`p-${s.products.length+1}`,remaining:work,inventory:0,target:0,line:false,launched:false,sold:0,revenue:0,profit:0,releaseDay:0});logEvent(s,'designStarted',data.name);
}
export function deviceCommand(s:GameState,c:GameCommand):boolean{
 if(c.type==='assemble'){
  requireRole(s,'engineering');
  if(!s.research.completed.includes(`${c.kind}-compute-1`))throw new Error('端末の基盤研究が必要です');
  const cooling=c.cooling??deviceCooling[c.kind].default;
  const result=evaluateDevice(s,c.parts,c.purpose,c.kind,c.osId,false,cooling);const tier=validateVisual(s.research.completed,c.kind,c.visual);
  assertProductPrice(c.price,{...result,kind:c.kind,unitCost:result.unitCost+visualFinishCost(tier),visual:c.visual},marketReference(c.kind,s.day));expense(s,developmentCost(c.kind,result.performance,s.day,b.designCost));
  appendProduct(s,{name:c.name,kind:c.kind,price:c.price,spec:{...c.parts,purpose:c.purpose,appearance:c.appearance,cooling,procurementCost:Object.values(c.parts).reduce((n,id)=>n+s.rivals.reduce((total,r)=>total+(r.products.find(p=>p.id===id)?.price??0),0),0),...(c.osId?{osId:c.osId}:{})},...result,unitCost:result.unitCost+visualFinishCost(tier),...(c.visual?{visual:c.visual}:{})},b.work/(1+techEffect(s.research.completed,c.kind,'capacity')));return true;
 }
 if(c.type==='developOS'){
  requireRole(s,'engineering');
  if(s.products.some(p=>p.kind==='os'&&p.name===c.name&&Number(p.spec.version)>=c.version))throw new Error('新しいバージョン番号が必要です');
  const {designCost,...result}=evaluateOS(s,c);
  expense(s,designCost);assertProductPrice(c.price,result);appendProduct(s,result,b.os.work);return true;
 }
 return false;
}
export type OSDesign={name:string,version:number,features:OSFeature[],quality:number,compatibility:number,support:number,price:number,lockScreen?:string,theme?:string};
/** OS metrics and design cost for a draft; validates research gates. Pure: does not charge or append. */
export function evaluateOS(s:GameState,c:OSDesign){
 if(!s.research.completed.includes('os-compute-1'))throw new Error('OS基盤研究が必要です');
 for(const f of c.features){const need=osFeatureResearch[f];if(need&&!s.research.completed.includes(need))throw new Error(`${osFeatureLabels[f]}には研究「${need}」が必要です`);}
 for(const key of Object.keys(osSliders) as OSSlider[]){
  const v=c[key],range=unlockedRange(osSliders[key],'os',s.research.completed);
  if(!Number.isFinite(v)||v<range.min-1e-9||v>range.max+1e-9)throw new Error(`${osSliders[key].label}は現在の研究では${Math.round(range.min*100)}～${Math.round(range.max*100)}%の範囲で設計できます`);
 }
 const extra=c.features.filter(f=>!['files','calculator','browser'].includes(f)).length;
 const e=(axis:string)=>techEffect(s.research.completed,'os',axis);
 // Research widens the quality/compatibility/support sliders; the chosen values are stored as designed.
 return {designCost:Math.round(Math.exp(-e('cost'))*b.os.designCost*(b.os.designQualityFloor+c.quality*b.os.designQualityWeight)*(b.os.designCompatibilityFloor+c.compatibility*b.os.designCompatibilityWeight)),
  name:c.name,kind:'os' as const,price:c.price,spec:{version:c.version,features:c.features.join(','),lockScreen:c.lockScreen??'aurora',theme:c.theme??'teal',quality:c.quality,compatibility:c.compatibility,support:c.support},reliability:hardwareBalance.reliabilityBase+hardwareBalance.reliabilityGain*(1-Math.exp(-e('reliability'))),performance:Math.round(c.quality*c.compatibility*(b.os.supportFloor+b.os.supportWeight*c.support)*b.scoreScale*(1+osBalance.featureDemand*extra)),power:0,unitCost:Math.max(1,Math.round(b.os.licenseCost*Math.exp(-e('power')*b.os.powerCostScale-e('cost')*b.os.costScale)))};
}
export function osApps(product:Product):string[]{
 if(product.kind!=='os'||product.remaining>0)return[];
 return String(product.spec.features).split(',').filter(app=>app!=='browser'||Number(product.spec.compatibility)>=b.os.browserCompatibility);
}
export function osMonthlyCost(s:GameState){return s.products.filter(p=>p.kind==='os'&&p.launched).reduce((n,p)=>n+Math.round(Number(p.spec.support)*b.os.supportMonthly),0);}
