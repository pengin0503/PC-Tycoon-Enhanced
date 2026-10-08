import {hardwareCatalog,defaultSpec} from './hardware';
import {hardwareKinds} from './research';
export const productKinds=[...hardwareKinds,'pc','laptop','os'] as const;
export const productCatalog={...hardwareCatalog,pc:{label:'完成PC',demand:45,reference:1000},laptop:{label:'ノートPC',demand:50,reference:850},os:{label:'OS',demand:100,reference:600}};
export const deviceBalance={caseCost:100,laptopPackaging:250,laptopCooling:.8,designCost:4000,work:20,
 referencePerformance:[1200,1600,320,150],scoreScale:1000,packagingResearchScale:.4,
 purposeWeights:{gaming:[.35,.4,.15,.1],office:[.4,.1,.2,.3],server:[.3,.1,.45,.15]},
 os:{designCost:5000,work:20,licenseCost:5,supportMonthly:1000,withoutOS:.8,baseCompatibility:.5,compatibilityWeight:.5,qualityFloor:.8,qualityWeight:.2,supportFloor:.8,supportWeight:.2,designQualityFloor:.5,designQualityWeight:.5,designCompatibilityFloor:.5,designCompatibilityWeight:.5,capacityScore:.1,powerScore:.05,powerCostScale:.5,costScale:.2,browserCompatibility:.6},
} as const;
const vendor=(id:string,kind:'cpu'|'gpu'|'motherboard'|'ram'|'storage',price:number,performance:number,power:number,spec=defaultSpec(kind))=>({id,name:`汎用 ${hardwareCatalog[kind].label}`,kind,unitCost:price,performance,power,spec});
export const vendorParts=[vendor('v-cpu','cpu',340,1200,22),vendor('v-gpu','gpu',442,1600,48),vendor('v-board','motherboard',172,200,12),vendor('v-ram','ram',128,320,3),vendor('v-storage','storage',122,151,5),vendor('v-cpu-nova','cpu',350,1200,22,{...defaultSpec('cpu'),socket:'Nova'}),vendor('v-ram-ddr5','ram',150,500,4,{...defaultSpec('ram'),memoryGen:'DDR5'})];
