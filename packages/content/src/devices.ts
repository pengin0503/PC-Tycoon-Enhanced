import {hardwareCatalog,defaultSpec,type Field} from './hardware';
import {hardwareKinds} from './research';
export const productKinds=[...hardwareKinds,'pc','laptop','os'] as const;
/** PC/laptop part slots. `psu` is optional: designs without it use a generic supply built into the case. */
export const deviceSlots=['cpu','gpu','motherboard','ram','storage','psu'] as const;
export type DeviceSlot=typeof deviceSlots[number];
export const productCatalog={...hardwareCatalog,pc:{label:'完成PC',demand:900,reference:1000},laptop:{label:'ノートPC',demand:1000,reference:850},os:{label:'OS',demand:2000,reference:600}};
/** Money in yen. `caseCost`/`laptopPackaging` are per unit; case cooling adds `deviceCoolingCost` per W. */
export const deviceBalance={caseCost:8000,laptopPackaging:40000,laptopCooling:.8,designCost:30000000,work:20,
 referencePerformance:[1200,1600,320,150],scoreScale:1000,packagingResearchScale:.4,
 purposeWeights:{gaming:[.35,.4,.15,.1],office:[.4,.1,.2,.3],server:[.3,.1,.45,.15]},
 os:{designCost:1000000000,work:20,licenseCost:1000,supportMonthly:10000000,withoutOS:.8,baseCompatibility:.5,compatibilityWeight:.5,qualityFloor:.8,qualityWeight:.2,supportFloor:.8,supportWeight:.2,designQualityFloor:.5,designQualityWeight:.5,designCompatibilityFloor:.5,designCompatibilityWeight:.5,powerCostScale:.5,costScale:.2,browserCompatibility:.6},
} as const;
/** Case cooling of PCs/laptops in W; must cover the parts' power draw. Thermal, layout and interface research widen it. */
export const deviceCooling={
 pc:{label:'冷却性能',unit:'W',min:30,max:2500,step:10,default:150,unlock:{axes:['power','compute','compatibility'],from:200}},
 laptop:{label:'冷却性能',unit:'W',min:10,max:600,step:5,default:80,unlock:{axes:['power','compute','compatibility'],from:80}},
} satisfies Record<'pc'|'laptop',Field>;
export const deviceCoolingCost={pc:30,laptop:60} as const;
const variant:Partial<Record<string,string>>={socket:'ソケット',memoryGen:'メモリ'};
const vendor=(id:string,kind:DeviceSlot,price:number,performance:number,power:number,spec=defaultSpec(kind))=>({id,
 name:`汎用 ${hardwareCatalog[kind].label}${Object.keys(variant).some(k=>k in spec)?`（${Object.keys(variant).filter(k=>k in spec).map(k=>spec[k]).join('/')}）`:''}`,kind,unitCost:price,performance,power,spec});
/**
 * Generic year-2000 parts sold by outside vendors at about 1.8× the manufacturing cost of the same default design.
 * Performance and power equal the metrics of those specs (checked by the content tests). Ids are kept for old saves.
 */
export const vendorParts=[vendor('v-cpu','cpu',34000,1200,31),vendor('v-gpu','gpu',22800,1600,11),vendor('v-board','motherboard',17500,225,12),vendor('v-ram','ram',12500,320,2),vendor('v-storage','storage',16200,150,6),
 vendor('v-cpu-nova','cpu',35000,1200,31,{...defaultSpec('cpu'),socket:'Nova'}),vendor('v-ram-ddr5','ram',15000,640,2,{...defaultSpec('ram'),memoryGen:'DDR',speed:266}),vendor('v-psu','psu',9900,188,13,{...defaultSpec('psu'),efficiency:75})];
