import type {HardwareKind} from './research';
export type Spec=Record<string,number|string>;
/** `legacyDefault`: value assumed for products saved before the field existed. */
export type Field={label:string,min?:number,max?:number,step?:number,default:number|string,options?:string[],legacyDefault?:number|string};
export type HardwareDefinition={label:string,fields:Record<string,Field>,designCost:number,work:number,demand:number,reference:number};
export const hardwareCatalog:Record<HardwareKind,HardwareDefinition>={
 cpu:{label:'CPU',designCost:3000,work:20,demand:70,reference:1200,fields:{cores:{label:'コア数',min:1,max:8,step:1,default:4},clock:{label:'クロック（ゲーム単位）',min:1,max:5,step:.1,default:3},ipc:{label:'IPC相当',min:.5,max:2,step:.1,default:1},process:{label:'プロセス相当',min:7,max:28,step:1,default:14},cache:{label:'キャッシュ容量',min:2,max:64,step:2,default:8,legacyDefault:8},socket:{label:'ソケット',options:['Atlas','Nova'],default:'Atlas'}}},
 gpu:{label:'GPU',designCost:5000,work:20,demand:50,reference:1600,fields:{units:{label:'演算資源',min:1,max:64,step:1,default:16},clock:{label:'クロック（ゲーム単位）',min:.5,max:3,step:.1,default:1},vram:{label:'VRAM容量',min:2,max:32,step:1,default:8},bandwidth:{label:'帯域',min:64,max:1024,step:1,default:256}}},
 motherboard:{label:'マザーボード',designCost:2000,work:20,demand:55,reference:200,fields:{socket:{label:'ソケット',options:['Atlas','Nova'],default:'Atlas'},memoryGen:{label:'メモリ世代',options:['DDR4','DDR5'],default:'DDR4'},slots:{label:'拡張スロット',min:1,max:8,step:1,default:4},features:{label:'機能数',min:1,max:10,step:1,default:2}}},
 ram:{label:'RAM',designCost:2000,work:20,demand:70,reference:320,fields:{memoryGen:{label:'メモリ世代',options:['DDR4','DDR5'],default:'DDR4'},capacity:{label:'容量',min:4,max:128,step:1,default:16},speed:{label:'速度',min:1600,max:6400,step:100,default:3200}}},
 storage:{label:'ストレージ',designCost:2000,work:20,demand:70,reference:150,fields:{capacity:{label:'容量',min:128,max:4096,step:1,default:512},speed:{label:'転送速度',min:100,max:7000,step:100,default:1000}}},
 psu:{label:'電源ユニット',designCost:2000,work:20,demand:60,reference:470,fields:{wattage:{label:'定格出力',min:300,max:1600,step:50,default:550},efficiency:{label:'変換効率',min:80,max:96,step:1,default:85},modular:{label:'ケーブル方式',options:['none','semi','full'],default:'none'}}},
 monitor:{label:'モニター',designCost:3000,work:20,demand:45,reference:600,fields:{resolution:{label:'解像度相当',min:720,max:4320,step:1,default:1080},refresh:{label:'リフレッシュレート',min:30,max:360,step:1,default:60},gamut:{label:'色域スコア',min:50,max:100,step:1,default:90},appearance:{label:'外観',options:['graphite','silver','teal'],default:'silver'}}},
};
export const hardwareBalance={baseFactoryCapacity:20,developmentPerWeek:10,researchPerWeek:10,maxInventory:100000,maxPrice:1000000,
 rootComputeBonus:.08,reliabilityBase:.9,reliabilityGain:.1,costResearchScale:.2,valueCeiling:2,priceCostMultiple:2,priceElasticity:1.5,osReferencePrice:50,osWeeklyLimit:500,hardDemand:.8,tycoonDemand:1.2,
 psu:{wattageCost:.12,efficiencyCost:6,efficiencyBase:80,modularCost:{none:0,semi:15,full:30},modularScore:{none:1,semi:1.05,full:1.1},lossCoefficient:.2,headroom:1.2,reliabilityPerEfficiency:.002},
 cpu:{referenceProcess:14,cacheReference:8,cacheExponent:.15,cacheCost:3,coreCost:20,clockCost:10,ipcCost:60,powerCoefficient:.6,scoreCoefficient:100},
 gpu:{unitCost:8,vramCost:10,bandwidthCost:.05,powerCoefficient:3,scoreCoefficient:100,referenceBandwidth:256},
 motherboard:{baseCost:30,slotCost:10,featureCost:8,slotScore:25,featureScore:50,basePower:10,featurePower:1},
 ram:{capacityCost:3,speedCost:.005,scoreDivisor:160,powerCoefficient:.2},storage:{capacityCost:.1,speedCost:.01,capacityScore:.1,speedScore:.1,powerCoefficient:.005},
 weeklyVariance:.2,awarenessFloor:.7,qualityFloor:.5,ageDecay:360,minimumAgeFactor:.25,
 monitor:{resolutionCost:.1,refreshCost:.8,gamutCost:1,scoreCoefficient:.001,powerCoefficient:.02},
} as const;
/** Range fields whose maximum grows with capacity research. */
export const capacityScaledFields=['cores','units','vram','slots','capacity','resolution','wattage','cache'];
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
