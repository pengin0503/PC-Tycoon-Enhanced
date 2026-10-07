import type {HardwareKind} from './research';
export type Spec=Record<string,number|string>;
export type Field={label:string,min?:number,max?:number,step?:number,default:number|string,options?:string[]};
export type HardwareDefinition={label:string,fields:Record<string,Field>,designCost:number,work:number,demand:number,reference:number};
export const hardwareCatalog:Record<HardwareKind,HardwareDefinition>={
 cpu:{label:'CPU',designCost:3000,work:20,demand:60,reference:1200,fields:{cores:{label:'コア数',min:1,max:8,step:1,default:4},clock:{label:'クロック（ゲーム単位）',min:1,max:5,step:.1,default:3},ipc:{label:'IPC相当',min:.5,max:2,step:.1,default:1},process:{label:'プロセス相当',min:7,max:28,step:1,default:14},socket:{label:'ソケット',options:['Atlas','Nova'],default:'Atlas'}}},
 gpu:{label:'GPU',designCost:5000,work:20,demand:50,reference:1600,fields:{units:{label:'演算資源',min:1,max:64,step:1,default:16},clock:{label:'クロック（ゲーム単位）',min:.5,max:3,step:.1,default:1},vram:{label:'VRAM容量',min:2,max:32,step:1,default:8},bandwidth:{label:'帯域',min:64,max:1024,step:1,default:256}}},
 motherboard:{label:'マザーボード',designCost:2000,work:20,demand:55,reference:200,fields:{socket:{label:'ソケット',options:['Atlas','Nova'],default:'Atlas'},memoryGen:{label:'メモリ世代',options:['DDR4','DDR5'],default:'DDR4'},slots:{label:'拡張スロット',min:1,max:8,step:1,default:4},features:{label:'機能数',min:1,max:10,step:1,default:2}}},
 ram:{label:'RAM',designCost:2000,work:20,demand:70,reference:320,fields:{memoryGen:{label:'メモリ世代',options:['DDR4','DDR5'],default:'DDR4'},capacity:{label:'容量',min:4,max:128,step:1,default:16},speed:{label:'速度',min:1600,max:6400,step:100,default:3200}}},
 storage:{label:'ストレージ',designCost:2000,work:20,demand:70,reference:150,fields:{capacity:{label:'容量',min:128,max:4096,step:1,default:512},speed:{label:'転送速度',min:100,max:7000,step:100,default:1000}}},
};
export const hardwareBalance={baseFactoryCapacity:20,developmentPerWeek:10,researchPerWeek:10,maxInventory:100000,maxPrice:1000000,
 cpu:{coreCost:20,clockCost:10,ipcCost:60,powerCoefficient:.6,scoreCoefficient:100},
 gpu:{unitCost:8,vramCost:10,bandwidthCost:.05,powerCoefficient:3,scoreCoefficient:100},
 motherboard:{baseCost:30,slotCost:10,featureCost:8,slotScore:25,featureScore:50},
 ram:{capacityCost:3,speedCost:.005,scoreDivisor:160},storage:{capacityCost:.1,speedCost:.01,capacityScore:.1,speedScore:.1},
 weeklyVariance:.2,awarenessFloor:.7,qualityFloor:.5,ageDecay:360,minimumAgeFactor:.25,
} as const;
export function defaultSpec(kind:HardwareKind):Spec{return Object.fromEntries(Object.entries(hardwareCatalog[kind].fields).map(([k,v])=>[k,v.default]));}
