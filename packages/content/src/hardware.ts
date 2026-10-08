import type {HardwareKind} from './research';
import {unlockedRange,type Unlock} from './unlocks';
export type Spec=Record<string,number|string>;
/**
 * `legacyDefault`: value assumed for products saved before the field existed.
 * `unit`: display unit of the game value. `unlock`: research branches that widen the slider from `unlock.from`
 * towards `max` (or towards `min` when `lowerIsBetter`).
 */
export type Field={label:string,min?:number,max?:number,step?:number,default:number|string,options?:string[],legacyDefault?:number|string,unit?:string,unlock?:Unlock,lowerIsBetter?:boolean};
export type HardwareDefinition={label:string,fields:Record<string,Field>,designCost:number,work:number,demand:number,reference:number};
const u=(axes:string[],from:number):Unlock=>({axes,from});
export const hardwareCatalog:Record<HardwareKind,HardwareDefinition>={
 cpu:{label:'CPU',designCost:3000,work:20,demand:70,reference:1200,fields:{
  cores:{label:'コア数',unit:'コア',min:1,max:32,step:1,default:4,unlock:u(['capacity'],4)},
  clock:{label:'クロック',unit:'GHz',min:1,max:6,step:.1,default:3,unlock:u(['compute'],3.2)},
  ipc:{label:'IPC相当',unit:'倍',min:.5,max:3,step:.1,default:1,unlock:u(['compute'],1.2)},
  process:{label:'製造プロセス',unit:'nm',min:3,max:28,step:1,default:14,lowerIsBetter:true,unlock:u(['power'],14)},
  cache:{label:'キャッシュ容量',unit:'MB',min:2,max:128,step:2,default:8,legacyDefault:8,unlock:u(['compatibility'],16)},
  cooling:{label:'冷却性能',unit:'W',min:10,max:400,step:5,default:40,legacyDefault:0,unlock:u(['power'],60)},
  socket:{label:'ソケット',options:['Atlas','Nova'],default:'Atlas'}}},
 gpu:{label:'GPU',designCost:5000,work:20,demand:50,reference:1600,fields:{
  units:{label:'演算ユニット',unit:'基',min:1,max:128,step:1,default:16,unlock:u(['capacity'],20)},
  clock:{label:'クロック',unit:'GHz',min:.5,max:3.5,step:.1,default:1,unlock:u(['compute'],1.2)},
  vram:{label:'VRAM容量',unit:'GB',min:2,max:80,step:1,default:8,unlock:u(['capacity'],16)},
  bandwidth:{label:'メモリ帯域',unit:'GB/s',min:64,max:2048,step:1,default:256,unlock:u(['compatibility'],320)},
  cooling:{label:'冷却性能',unit:'W',min:20,max:1500,step:10,default:80,legacyDefault:0,unlock:u(['power'],120)}}},
 motherboard:{label:'マザーボード',designCost:2000,work:20,demand:55,reference:200,fields:{socket:{label:'ソケット',options:['Atlas','Nova'],default:'Atlas'},memoryGen:{label:'メモリ世代',options:['DDR4','DDR5'],default:'DDR4'},
  slots:{label:'拡張スロット',unit:'本',min:1,max:12,step:1,default:4,unlock:u(['compatibility'],4)},
  features:{label:'機能数',unit:'個',min:1,max:16,step:1,default:2,unlock:u(['compute'],3)}}},
 ram:{label:'RAM',designCost:2000,work:20,demand:70,reference:320,fields:{memoryGen:{label:'メモリ世代',options:['DDR4','DDR5'],default:'DDR4'},
  capacity:{label:'容量',unit:'GB',min:4,max:256,step:1,default:16,unlock:u(['capacity'],32)},
  speed:{label:'転送レート',unit:'MT/s',min:1600,max:8800,step:100,default:3200,unlock:u(['compute','compatibility'],3600)}}},
 storage:{label:'ストレージ',designCost:2000,work:20,demand:70,reference:150,fields:{
  capacity:{label:'容量',unit:'GB',min:128,max:16384,step:1,default:512,unlock:u(['capacity'],1024)},
  speed:{label:'転送速度',unit:'MB/s',min:100,max:14000,step:100,default:1000,unlock:u(['compute','compatibility'],1500)}}},
 psu:{label:'電源ユニット',designCost:2000,work:20,demand:60,reference:470,fields:{
  wattage:{label:'定格出力',unit:'W',min:300,max:2000,step:50,default:550,unlock:u(['capacity','compute'],750)},
  efficiency:{label:'変換効率',unit:'%',min:80,max:96,step:1,default:85,unlock:u(['power','compatibility'],88)},
  modular:{label:'ケーブル方式',options:['none','semi','full'],default:'none'}}},
 monitor:{label:'モニター',designCost:3000,work:20,demand:45,reference:600,fields:{
  resolution:{label:'解像度（縦）',unit:'p',min:720,max:4320,step:1,default:1080,unlock:u(['capacity'],1440)},
  refresh:{label:'リフレッシュレート',unit:'Hz',min:30,max:480,step:1,default:60,unlock:u(['compute'],75)},
  gamut:{label:'色域カバー率',unit:'%',min:50,max:100,step:1,default:90,unlock:u(['compatibility'],92)},
  appearance:{label:'外観',options:['graphite','silver','teal'],default:'silver'}}},
};
export const hardwareBalance={baseFactoryCapacity:20,developmentPerWeek:10,researchPerWeek:10,maxInventory:100000,maxPrice:1000000,
 reliabilityBase:.9,reliabilityGain:.1,costResearchScale:.2,valueCeiling:2,priceCostMultiple:2,priceElasticity:1.5,osReferencePrice:50,osWeeklyLimit:500,hardDemand:.8,tycoonDemand:1.2,
 /** Cooler cost per W of capacity; headroom above power draw adds reliability up to `reliabilityBonus` at `fullHeadroom`. */
 cooling:{cost:{cpu:.5,gpu:.4} as Record<string,number>,reliabilityBonus:.02,fullHeadroom:.5},
 psu:{wattageCost:.12,efficiencyCost:6,efficiencyBase:80,modularCost:{none:0,semi:15,full:30},modularScore:{none:1,semi:1.05,full:1.1},lossCoefficient:.2,headroom:1.2,reliabilityPerEfficiency:.002},
 cpu:{referenceProcess:14,cacheReference:8,cacheExponent:.15,cacheCost:3,coreCost:20,clockCost:10,ipcCost:60,powerCoefficient:.6,scoreCoefficient:100},
 gpu:{unitCost:8,vramCost:10,bandwidthCost:.05,powerCoefficient:3,scoreCoefficient:100,referenceBandwidth:256},
 motherboard:{baseCost:30,slotCost:10,featureCost:8,slotScore:25,featureScore:50,basePower:10,featurePower:1},
 ram:{capacityCost:3,speedCost:.005,scoreDivisor:160,powerCoefficient:.2},storage:{capacityCost:.1,speedCost:.01,capacityScore:.1,speedScore:.1,powerCoefficient:.005},
 weeklyVariance:.2,awarenessFloor:.7,qualityFloor:.5,ageDecay:360,minimumAgeFactor:.25,
 monitor:{resolutionCost:.1,refreshCost:.8,gamutCost:1,scoreCoefficient:.001,powerCoefficient:.02},
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
/** Reliability gained from cooling capacity above the power draw (0 when the cooler only just suffices). */
export function coolingReliability(power:number,cooling:number){
 const c=hardwareBalance.cooling;const headroom=Math.max(0,cooling-power)/Math.max(1,power);
 return c.reliabilityBonus*Math.min(1,headroom/c.fullHeadroom);
}
