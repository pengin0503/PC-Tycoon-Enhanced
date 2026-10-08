import {vendorParts,deviceSlots,deviceBalance as b} from '../../content/src/devices';
import type {GameState,GameCommand,Product} from './types';
import {expense,logEvent} from './finance';
import {hardwareBalance} from '../../content/src/hardware';
import {techEffect} from '../../content/src/research';
import {validateVisual,visualFinishCost} from './visual';
import {assertProductPrice} from './pricing';
import {osRequirements,meetsOSRequirements} from './os';
import {osBalance} from '../../content/src/os';
/** Production overhead is fixed at design time, excluding separately sourced components. */
export function assemblyOverhead(s:GameState,p:Product):number{
 if(typeof p.spec.assemblyOverhead==='number')return Number(p.spec.assemblyOverhead);
 const ids=deviceSlots;
 const own=ids.reduce((n,k)=>n+(s.products.find(part=>part.id===p.spec[k])?.unitCost??0),0);
 const generic=ids.reduce((n,k)=>n+(vendorParts.find(part=>part.id===p.spec[k])?.unitCost??0),0);
 return Math.max(1,p.unitCost-own-generic-Number(p.spec.procurementCost??0));
}

/** Own, generic vendor or (unless acquired, when not `allowLegacy`) launched rival part by id. */
export function findPart(s:GameState,id:string|undefined,allowLegacy=false){
 if(id===undefined)return undefined;
 return s.products.find(p=>p.id===id)??vendorParts.find(p=>p.id===id)??s.rivals.flatMap(r=>(allowLegacy||!r.acquired)?r.products.filter(p=>p.launched):[]).find(p=>p.id===id);
}
/** Parts referenced by a PC/laptop spec; the optional PSU slot is included only when present. */
export function deviceParts(spec:Record<string,string|number>):Partial<Record<typeof deviceSlots[number],string>>{
 return Object.fromEntries(deviceSlots.filter(k=>spec[k]!==undefined).map(k=>[k,String(spec[k])]));
}
export function evaluateDevice(s:GameState,parts:Partial<Record<string,string>>,purpose:'gaming'|'office'|'server',kind:'pc'|'laptop',osId?:string,allowLegacy=false){
 const rivals=s.rivals.flatMap(r=>r.products.map(p=>({part:p,owner:r})));
 const resolve=(k:string)=>{const p=findPart(s,parts[k],allowLegacy);
  if(!p||p.kind!==k||('remaining'in p&&p.remaining>0))throw new Error('利用可能な部品を選択してください');return p;};
 const resolved=(['cpu','gpu','motherboard','ram','storage'] as const).map(resolve);
 const [cpu,gpu,board,ram,storage]=resolved;
 if(cpu.spec.socket!==board.spec.socket||ram.spec.memoryGen!==board.spec.memoryGen)throw new Error('ソケットまたはメモリ世代が非互換です');
 const psu=parts.psu===undefined?undefined:resolve('psu');
 const draw=resolved.reduce((n,p)=>n+p.power,0);
 if(psu&&Number(psu.spec.wattage)<draw*hardwareBalance.psu.headroom)throw new Error(`電源の定格出力が不足しています（必要 ${Math.ceil(draw*hardwareBalance.psu.headroom)}W 以上）`);
 const psuReliability=psu?(Number(psu.spec.efficiency)-hardwareBalance.psu.efficiencyBase)*hardwareBalance.psu.reliabilityPerEfficiency:0;
 const priced=psu?[...resolved,psu]:resolved;
 const os=osId?s.products.find(p=>p.id===osId&&p.kind==='os'&&p.launched):undefined;if(osId&&!os)throw new Error('発売済みOSが必要です');
 const factors=[cpu,gpu,ram,storage].map((p,i)=>p.performance/b.referencePerformance[i]);
 const score=factors.reduce((sum,x,i)=>sum+x*b.purposeWeights[purpose][i],0)*b.scoreScale;
 const unmet=os&&!meetsOSRequirements(s,parts as Record<string,string>,osRequirements(os))?osBalance.unmetPerformance:1;
 const osFactor=os?(b.os.baseCompatibility+Number(os.spec.compatibility)*b.os.compatibilityWeight)*(b.os.qualityFloor+Number(os.spec.quality)*b.os.qualityWeight)*unmet:b.os.withoutOS;
 const e=(axis:string)=>techEffect(s.research.completed,kind,axis);
 return {reliability:Math.min(1,hardwareBalance.reliabilityBase+hardwareBalance.reliabilityGain*(1-Math.exp(-e('reliability')))+psuReliability),performance:Math.round(score*osFactor*(1+Math.max(0,e('compute')-hardwareBalance.rootComputeBonus)+e('compatibility'))*(kind==='laptop'?b.laptopCooling:1)),power:Math.round(resolved.reduce((n,p)=>n+p.power,0)*Math.exp(-e('power'))),unitCost:priced.reduce((n,p)=>n+(rivals.find(x=>x.part.id===p.id)?.part.price??p.unitCost),0)+Math.round((b.caseCost+(kind==='laptop'?b.laptopPackaging:0))*Math.exp(-e('cost')*b.packagingResearchScale))+(os?os.unitCost:0)};
}
export function appendProduct(s:GameState,data:Pick<Product,'name'|'kind'|'spec'|'price'|'performance'|'power'|'unitCost'> & {reliability?:number,visual?:Product['visual']},work:number){
 if(s.products.length>=500)throw new Error('製品数の上限です');
 s.products.push({...data,reliability:data.reliability??hardwareBalance.reliabilityBase,id:`p-${s.products.length+1}`,remaining:work,inventory:0,target:0,line:false,launched:false,sold:0,revenue:0,profit:0,releaseDay:0});logEvent(s,'designStarted',data.name);
}
export function deviceCommand(s:GameState,c:GameCommand):boolean{
 if(c.type==='assemble'){
  if(!s.research.completed.includes(`${c.kind}-compute-1`))throw new Error('端末の基盤研究が必要です');
  const result=evaluateDevice(s,c.parts,c.purpose,c.kind,c.osId);const tier=validateVisual(s.research.completed,c.kind,c.visual);
  assertProductPrice(c.price,{...result,kind:c.kind,unitCost:result.unitCost+visualFinishCost(tier),visual:c.visual});expense(s,b.designCost);
  appendProduct(s,{name:c.name,kind:c.kind,price:c.price,spec:{...c.parts,purpose:c.purpose,appearance:c.appearance,procurementCost:Object.values(c.parts).reduce((n,id)=>n+s.rivals.reduce((total,r)=>total+(r.products.find(p=>p.id===id)?.price??0),0),0),...(c.osId?{osId:c.osId}:{})},...result,unitCost:result.unitCost+visualFinishCost(tier),...(c.visual?{visual:c.visual}:{})},b.work/(1+techEffect(s.research.completed,c.kind,'capacity')));return true;
 }
 if(c.type==='developOS'){
  if(!s.research.completed.includes('os-compute-1'))throw new Error('OS基盤研究が必要です');
  if(s.products.some(p=>p.kind==='os'&&p.name===c.name&&Number(p.spec.version)>=c.version))throw new Error('新しいバージョン番号が必要です');
  const e=(axis:string)=>techEffect(s.research.completed,'os',axis);
  expense(s,Math.round(Math.exp(-e('cost'))*b.os.designCost*(b.os.designQualityFloor+c.quality*b.os.designQualityWeight)*(b.os.designCompatibilityFloor+c.compatibility*b.os.designCompatibilityWeight)));
  const result={name:c.name,kind:'os' as const,price:c.price,spec:{version:c.version,features:c.features.join(','),quality:c.quality+(1-c.quality)*(1-Math.exp(-e('reliability'))),compatibility:c.compatibility+(1-c.compatibility)*(1-Math.exp(-e('compatibility'))),support:c.support},reliability:hardwareBalance.reliabilityBase+hardwareBalance.reliabilityGain*(1-Math.exp(-e('reliability'))),performance:Math.round(c.quality*c.compatibility*(b.os.supportFloor+b.os.supportWeight*c.support)*b.scoreScale*(1+Math.max(0,e('compute')-hardwareBalance.rootComputeBonus)+e('capacity')*b.os.capacityScore+e('power')*b.os.powerScore)),power:0,unitCost:Math.max(1,Math.round(b.os.licenseCost*Math.exp(-e('power')*b.os.powerCostScale-e('cost')*b.os.costScale)))};assertProductPrice(c.price,result);appendProduct(s,result,b.os.work);return true;
 }
 return false;
}
export function osApps(product:Product):string[]{
 if(product.kind!=='os'||product.remaining>0)return[];
 return String(product.spec.features).split(',').filter(app=>app!=='browser'||Number(product.spec.compatibility)>=b.os.browserCompatibility);
}
export function osMonthlyCost(s:GameState){return s.products.filter(p=>p.kind==='os'&&p.launched).reduce((n,p)=>n+Math.round(Number(p.spec.support)*b.os.supportMonthly),0);}
