import type {HardwareKind} from './research';
import {unlockedRange,unlockProgress,frontierGrowth,type Unlock,type OptionUnlock} from './unlocks';
import {unlockedOptions,techYear,eraAxes} from './era';
export type Spec=Record<string,number|string>;
/**
 * `legacyDefault`: value assumed for products saved before the field existed.
 * `unit`: display unit of the game value. `unlock`: research branches that widen the slider from `unlock.from`
 * towards `max` (or towards `min` when `lowerIsBetter`). `values`: selectable steps of a slider whose range spans
 * several orders of magnitude. `optionUnlock`: technology years at which option choices become available.
 * Starting limits (`unlock.from`) and defaults are year-2000 technology; absolute bounds are year-2100 technology.
 */
export type Field={label:string,min?:number,max?:number,step?:number,values?:readonly number[],default:number|string,options?:string[],optionUnlock?:OptionUnlock,legacyDefault?:number|string,unit?:string,unlock?:Unlock,lowerIsBetter?:boolean};
export type HardwareDefinition={label:string,fields:Record<string,Field>,designCost:number,work:number,demand:number,reference:number};
const u=(axes:string[],from:number,log=false):Unlock=>({axes,from,log});
const counts=[1,2,3,4,6,8,12,16,24,32,48,64,96,128,192,256,384,512,768,1024,1536,2048,3072,4096,6144,8192,12288,16384,24576,32768,49152,65536];
const binary=(from:number,to:number)=>{const out:number[]=[];for(let v=from;v<=to*1.0001;v*=2)out.push(Number(v.toPrecision(6)));return out;};
/** Memory sizes in GB: binary steps below 1 GB, then 1-1.5-2 style steps as modules and boards actually ship. */
const memorySizes=(from:number,to:number)=>[.008,.016,.032,.064,.128,.256,.512,1,2,3,4,6,8,12,16,24,32,48,64,96,128,192,256,384,512,768,1024,1536,2048,3072,4096,6144,8192,12288,16384].filter(v=>v>=from&&v<=to);
/** 1-2-5 style steps for quantities that grow by orders of magnitude (GB, MB/s, GB/s, W). */
const decades=(from:number,to:number)=>{
 const out:number[]=[];
 for(let e=Math.floor(Math.log10(from))-1;e<=Math.ceil(Math.log10(to));e++)for(const m of [1,1.5,2,3,4,5,6,8]){const v=Number((m*10**e).toPrecision(6));if(v>=from*.9999&&v<=to*1.0001)out.push(v);}
 return out;
};
/** Marketing node names in nm, from 350 nm down to 0.1 nm. */
const processNodes=[350,250,180,150,130,110,90,65,45,32,28,22,20,16,14,12,10,7,6,5,4,3,2,1.6,1.4,1,.7,.5,.35,.25,.18,.13,.1];
const memoryGenerations=['SDR','DDR','DDR2','DDR3','DDR4','DDR5','DDR6','DDR7','DDR8','DDR9'];
/** First technology year of each memory generation (motherboards and RAM; compatibility research). */
const memoryYears:Record<string,number>={SDR:2000,DDR:2000,DDR2:2004,DDR3:2007,DDR4:2014,DDR5:2021,DDR6:2030,DDR7:2042,DDR8:2058,DDR9:2078};
export const hardwareCatalog:Record<HardwareKind,HardwareDefinition>={
 cpu:{label:'CPU',designCost:300000,work:20,demand:70,reference:1200,fields:{
  cores:{label:'コア数',unit:'コア',min:1,max:4096,values:counts.filter(v=>v<=4096),default:1,unlock:u(['capacity'],1,true)},
  clock:{label:'クロック',unit:'GHz',min:.1,max:10,step:.1,default:.8,unlock:u(['compute'],1)},
  ipc:{label:'IPC相当',unit:'倍',min:.5,max:10,step:.1,default:1,unlock:u(['compute'],1)},
  process:{label:'製造プロセス',unit:'nm',min:.1,max:350,values:processNodes,default:180,lowerIsBetter:true,unlock:u(['power'],180,true)},
  cache:{label:'キャッシュ容量',unit:'MB',min:.0625,max:65536,values:binary(.0625,65536),default:.25,legacyDefault:8,unlock:u(['compatibility'],.5,true)},
  cooling:{label:'冷却性能',unit:'W',min:5,max:1000,values:decades(5,1000),default:40,legacyDefault:0,unlock:u(['power'],60)},
  socket:{label:'ソケット',options:['Atlas','Nova'],default:'Atlas'}}},
 gpu:{label:'GPU',designCost:500000,work:20,demand:50,reference:1600,fields:{
  units:{label:'演算ユニット',unit:'基',min:1,max:65536,values:counts,default:2,unlock:u(['capacity'],4,true)},
  clock:{label:'クロック',unit:'GHz',min:.05,max:6,step:.05,default:.2,unlock:u(['compute'],.25)},
  vram:{label:'VRAM容量',unit:'GB',min:.008,max:4096,values:memorySizes(.008,4096),default:.032,unlock:u(['capacity'],.064,true)},
  bandwidth:{label:'メモリ帯域',unit:'GB/s',min:1,max:1000000,values:decades(1,1000000),default:3,unlock:u(['compatibility'],5,true)},
  process:{label:'製造プロセス',unit:'nm',min:.1,max:350,values:processNodes,default:180,legacyDefault:5,lowerIsBetter:true,unlock:u(['power'],180,true)},
  cooling:{label:'冷却性能',unit:'W',min:5,max:1500,values:decades(5,1500),default:20,legacyDefault:0,unlock:u(['power'],40)}}},
 motherboard:{label:'マザーボード',designCost:200000,work:20,demand:55,reference:225,fields:{socket:{label:'ソケット',options:['Atlas','Nova'],default:'Atlas'},
  memoryGen:{label:'メモリ世代',options:memoryGenerations,optionUnlock:{axes:['compatibility'],years:memoryYears},default:'SDR'},
  slots:{label:'拡張スロット',unit:'本',min:1,max:12,step:1,default:5,unlock:u(['compatibility'],6)},
  features:{label:'機能数',unit:'個',min:1,max:16,step:1,default:2,unlock:u(['compute'],3)},
  bus:{label:'チップセット帯域',unit:'GB/s',min:.5,max:100000,values:decades(.5,100000),default:1,legacyDefault:64,unlock:u(['compute','compatibility'],1,true)}}},
 ram:{label:'RAM',designCost:200000,work:20,demand:70,reference:320,fields:{memoryGen:{label:'メモリ世代',options:memoryGenerations,optionUnlock:{axes:['compatibility'],years:memoryYears},default:'SDR'},
  capacity:{label:'容量',unit:'GB',min:.016,max:16384,values:memorySizes(.016,16384),default:.128,unlock:u(['capacity'],.256,true)},
  speed:{label:'転送レート',unit:'MT/s',min:66,max:200000,values:[66,100,133,200,266,333,400,533,667,800,1066,1333,1600,1866,2133,2400,2666,3200,3600,4000,4800,5600,6400,7200,8000,8800,10000,12800,16000,20000,25600,32000,40000,51200,64000,80000,100000,128000,160000,200000],default:133,unlock:u(['compute','compatibility'],266,true)}}},
 storage:{label:'ストレージ',designCost:200000,work:20,demand:70,reference:150,fields:{
  capacity:{label:'容量',unit:'GB',min:1,max:4000000,values:decades(1,4000000),default:20,unlock:u(['capacity'],80,true)},
  speed:{label:'転送速度',unit:'MB/s',min:5,max:2000000,values:decades(5,2000000),default:30,unlock:u(['compute','compatibility'],40,true)}}},
 psu:{label:'電源ユニット',designCost:200000,work:20,demand:60,reference:175,fields:{
  wattage:{label:'定格出力',unit:'W',min:150,max:3000,step:50,default:250,unlock:u(['capacity','compute'],400)},
  efficiency:{label:'変換効率',unit:'%',min:60,max:99,step:1,default:70,unlock:u(['power','compatibility'],75)},
  modular:{label:'ケーブル方式',options:['none','semi','full'],optionUnlock:{axes:['compatibility'],years:{semi:2004,full:2008}},default:'none'}}},
 monitor:{label:'モニター',designCost:300000,work:20,demand:45,reference:600,fields:{
  resolution:{label:'解像度（縦）',unit:'p',min:480,max:17280,values:[480,600,768,900,1024,1080,1200,1440,1600,2160,2880,4320,8640,17280],default:768,unlock:u(['capacity'],1200,true)},
  refresh:{label:'リフレッシュレート',unit:'Hz',min:50,max:2000,values:[50,60,70,75,85,100,120,144,165,180,240,280,360,480,540,750,1000,1500,2000],default:75,unlock:u(['compute'],85,true)},
  gamut:{label:'色域カバー率',unit:'%',min:40,max:100,step:1,default:70,unlock:u(['compatibility'],75)},
  appearance:{label:'外観',options:['graphite','silver','teal'],default:'silver'}}},
};
/**
 * Money is in yen at roughly real-world year-2000 Japanese retail scale. Costs (`*Cost`) apply to values divided by
 * the research frontier growth of their field (see `frontierGrowth`); performance and power use the raw values.
 */
export const hardwareBalance={baseFactoryCapacity:20,developmentPerWeek:10,researchPerWeek:10,maxInventory:100000,maxPrice:100000000,
 reliabilityBase:.9,reliabilityGain:.1,costResearchScale:.2,valueCeiling:2,priceCostMultiple:2,priceElasticity:1.5,osReferencePrice:10000,osWeeklyLimit:500,hardDemand:.8,tycoonDemand:1.2,
 /** Cooler cost per W of capacity; headroom above power draw adds reliability up to `reliabilityBonus` at `fullHeadroom`. */
 cooling:{cost:{cpu:50,gpu:40} as Record<string,number>,reliabilityBonus:.02,fullHeadroom:.5},
 /** Power of CPUs/GPUs scales with (process/referenceProcess)^processExponent, so smaller nodes run cooler. */
 referenceProcess:180,processExponent:.6,
 psu:{wattageCost:12,efficiencyCost:300,efficiencyBase:70,modularCost:{none:0,semi:1500,full:3000},modularScore:{none:1,semi:1.05,full:1.1},lossCoefficient:.2,headroom:1.2,reliabilityPerEfficiency:.002,baseCost:1000},
 cpu:{cacheReference:.25,cacheExponent:.15,baseCost:4000,cacheCost:4000,coreCost:6000,clockCost:5000,ipcCost:2000,powerCoefficient:39,scoreCoefficient:1500},
 gpu:{baseCost:3000,unitCost:2500,clockCost:10000,vramCost:30000,bandwidthCost:300,powerCoefficient:29,unitsPowerExponent:.88,scoreCoefficient:4000,bandwidthPerOp:6.6},
 motherboard:{baseCost:3000,slotCost:800,featureCost:600,busCost:1500,slotScore:25,featureScore:50,busReference:1,busExponent:.5,basePower:10,featurePower:1},
 ram:{baseCost:500,capacityCost:40000,speedCost:10,scoreDivisor:.0532,powerCoefficient:.2,basePower:2},
 storage:{baseCost:3000,capacityCost:150,speedCost:100,scoreCoefficient:6.12,basePower:4,speedPower:.05},
 weeklyVariance:.2,awarenessFloor:.7,qualityFloor:.5,ageDecay:360,minimumAgeFactor:.25,
 monitor:{baseCost:8000,resolutionCost:10,refreshCost:100,gamutCost:100,scoreCoefficient:1.49e-4,powerCoefficient:.04,referenceRefresh:75},
} as const;
export function defaultSpec(kind:HardwareKind):Spec{return Object.fromEntries(Object.entries(hardwareCatalog[kind].fields).map(([k,v])=>[k,v.default]));}
/** Fills fields added after a product was saved; rejects unknown or missing current fields. */
export function normalizeSpec(kind:HardwareKind,spec:Spec):Spec{
 const fields=hardwareCatalog[kind].fields;
 if(Object.keys(spec).some(k=>!(k in fields)))throw new Error('仕様の項目が不正です');
 const out:Spec={};
 for(const [key,field] of Object.entries(fields)){
  const v=spec[key]??field.legacyDefault;
  if(v===undefined)throw new Error('仕様の項目が不正です');
  out[key]=v;
 }
 return out;
}
/** Selectable range of a numeric field with the given completed research. */
export function fieldRange(kind:HardwareKind,key:string,completed:readonly string[]){return unlockedRange(hardwareCatalog[kind].fields[key],kind,completed);}
/** Option choices of a field available with the given completed research. */
export function fieldOptions(kind:HardwareKind,key:string,completed:readonly string[]){const f=hardwareCatalog[kind].fields[key];return unlockedOptions(f.options??[],f.optionUnlock,kind,completed);}
/** Frontier growth of a field with the given research (1 for fields research does not widen). */
export function fieldGrowth(kind:HardwareKind,key:string,completed:readonly string[]){
 const f=hardwareCatalog[kind].fields[key];return f.unlock?frontierGrowth(f,unlockProgress(completed,kind,f.unlock.axes)):1;
}
/** Technology year a component's research has reached: the mean progress of the branches that widen its fields. */
export function hardwareTechYear(kind:HardwareKind,completed:readonly string[]){
 return techYear(completed,kind,eraAxes(Object.values(hardwareCatalog[kind].fields).flatMap(f=>[f.unlock,f.optionUnlock])));
}
/** Reliability gained from cooling capacity above the power draw (0 when the cooler only just suffices). */
export function coolingReliability(power:number,cooling:number){
 const c=hardwareBalance.cooling;const headroom=Math.max(0,cooling-power)/Math.max(1,power);
 return c.reliabilityBonus*Math.min(1,headroom/c.fullHeadroom);
}
