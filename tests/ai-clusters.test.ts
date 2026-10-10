import {withTestStaff} from './staff-fixture';
const createGame=(...args:Parameters<typeof baseGame>)=>withTestStaff(baseGame(...args),false);
import {it,expect} from 'vitest';
import {createGame as baseGame,command} from '../packages/sim/src/index';
import {defaultSpec} from '../packages/content/src/hardware';
import {unlockBranch} from './research-helpers';
import {exportSave,importSave} from '../packages/save/src/index';
import {companyValue} from '../packages/sim/src/management';
const cmd=(s:any,c:any)=>command(s,c);
function ownGPUReady(){
 let s=createGame({id:'own',name:'AI社',difficulty:'normal',seed:1});
 s.day=12*360;s.year=2012;s.research.completed=['ai-compute-1','gpu-compute-1'];unlockBranch(unlockBranch(s,'gpu','units',5),'gpu','vram',5);
 s=cmd(s,{type:'design',kind:'gpu',name:'Own GPU',spec:{...defaultSpec('gpu'),vram:1},price:20000});
 s=cmd(s,{type:'advance',days:14});
 s=cmd(s,{type:'launch',id:'p-1'});s=cmd(s,{type:'line',id:'p-1',target:100});
 return cmd(s,{type:'advance',days:1});
}
it('buys finite compute with capital cost and rejects bad counts',()=>{
 const s=ownGPUReady();
 const c={type:'buyCluster',gpuId:'p-1',serverId:'vendor',gpus:2,network:.8,cooling:.9};const n=cmd(s,c);
 expect(()=>cmd(s,{...c,gpuId:'v-ai-workstation'})).toThrow(/自社GPU/);
 expect(n.clusters).toHaveLength(1);expect(n.clusters[0].vramBytes).toBe(2e9);expect(n.company.cash).toBe(s.company.cash-200000);expect(n.finance.capital-s.finance.capital).toBe(200000);
 expect(()=>cmd(s,{...c,gpus:0})).toThrow();expect(()=>cmd(s,{...c,gpuId:'missing'})).toThrow();expect(s.clusters).toEqual([]);
});
it('own GPU transfers stock once and retains its asset value for operating cost',()=>{
 let s=createGame({id:'own',name:'統合社',difficulty:'normal',seed:1});s.day=17*360;s.year=2017;s.research.completed=['ai-compute-1','gpu-compute-1'];
 s=cmd(s,{type:'design',kind:'gpu',name:'Own GPU',spec:defaultSpec('gpu'),price:20000});s=cmd(s,{type:'advance',days:14});s=cmd(s,{type:'launch',id:'p-1'});s=cmd(s,{type:'line',id:'p-1',target:100});s=cmd(s,{type:'advance',days:1});
 const n=cmd(s,{type:'buyCluster',gpuId:'p-1',serverId:'vendor',gpus:1,network:.8,cooling:.9});expect(n.products[0].inventory).toBe(s.products[0].inventory-1);expect(n.clusters[0].purchaseCost).toBe(200000+s.products[0].unitCost);expect(n.finance.capital).toBe(200000);
});

it('assigns a server built from own and generic components together with an own GPU to AI cluster',()=>{
 let s=ownGPUReady();
 s.research.completed.push('pc-compute-1');
 s=cmd(s,{type:'assemble',kind:'pc',name:'In-house server',parts:{cpu:'v-cpu',gpu:'p-1',motherboard:'v-board',ram:'v-ram',storage:'v-storage'},purpose:'server',appearance:'graphite',price:300000});
 s=cmd(s,{type:'advance',days:14});s=cmd(s,{type:'launch',id:'p-2'});s=cmd(s,{type:'line',id:'p-2',target:3});
 s=cmd(s,{type:'advance',days:2});
 expect(s.products[1].inventory).toBeGreaterThan(0);
 expect(s.products[0].inventory).toBeGreaterThan(0);
 const ownGPUStock=s.products[0].inventory,serverStock=s.products[1].inventory;
 const n=cmd(s,{type:'buyCluster',gpuId:'p-1',serverId:'p-2',gpus:1,network:.8,cooling:.9});
 expect(n.clusters[0].serverId).toBe('p-2');
 expect(n.products[0].inventory).toBe(ownGPUStock-1);
 expect(n.products[1].inventory).toBe(serverStock-1);
});
it('accepts effective network below the 0.1 build-input floor and round trips it',()=>{
 let s=ownGPUReady();s.research.completed.push('pc-compute-1');
 s=cmd(s,{type:'assemble',kind:'pc',name:'In-house server',parts:{cpu:'v-cpu',gpu:'p-1',motherboard:'v-board',ram:'v-ram',storage:'v-storage'},purpose:'server',appearance:'graphite',price:300000});
 s=cmd(s,{type:'advance',days:14});s=cmd(s,{type:'launch',id:'p-2'});s=cmd(s,{type:'line',id:'p-2',target:3});s=cmd(s,{type:'advance',days:2});
 s.products.find(p=>p.id==='p-2')!.performance=801;
 const cluster=cmd(s,{type:'buyCluster',gpuId:'p-1',serverId:'p-2',gpus:1,network:.1,cooling:.9});
 expect(cluster.clusters[0].network).toBeCloseTo(.0801);
 expect(importSave(exportSave(cluster))).toEqual(cluster);
});
it('preserves cluster asset value at purchase, depreciates it, and migrates legacy age safely',()=>{
 const s=ownGPUReady();const before=companyValue(s);
 const purchased=cmd(s,{type:'buyCluster',gpuId:'p-1',serverId:'vendor',gpus:1,network:.8,cooling:.9});
 const cost=purchased.clusters[0].purchaseCost;
 expect(companyValue(purchased)).toBe(before);
 const oneYear=structuredClone(purchased);oneYear.day+=365;
 expect(companyValue(oneYear)).toBe(before-Math.round(cost/3));
 const legacy:any=JSON.parse(exportSave(purchased));legacy.day=5000;delete legacy.clusters[0].purchaseDay;
 const restored=importSave(JSON.stringify(legacy));
 expect(restored.clusters[0].purchaseDay).toBe(5000);
 expect(companyValue(restored)).toBe(companyValue({...restored,day:restored.clusters[0].purchaseDay}));
});

