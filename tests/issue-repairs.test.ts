import {it,expect} from 'vitest';
import {createGame,command} from '../packages/sim/src/index';
import {manufacture,sellProducts} from '../packages/sim/src/hardware';
import {evaluateHardware} from '../packages/sim/src/hardware';
import {defaultSpec} from '../packages/content/src/hardware';
import {importSave,exportSave} from '../packages/save/src/index';
const commandAny=(s:any,c:any)=>command(s,c);
function prepared(){
 const s=createGame({id:'repair',name:'検証会社',difficulty:'normal',seed:71});
 s.research.completed=['pc-compute-1'];
 const r=s.rivals[0];r.researchLevel=1;
 const metrics=evaluateHardware('cpu',defaultSpec('cpu'),['cpu-compute-1']);
 r.products.push({id:'rival-cpu-p1',name:'競合CPU',kind:'cpu',spec:{...defaultSpec('cpu'),generation:1},...metrics,
 price:50000,inventory:20,target:100,line:true,launched:true,remaining:0,sold:0,revenue:0,profit:0,releaseDay:0});
 return s;
}
const parts={cpu:'rival-cpu-p1',gpu:'v-gpu',motherboard:'v-board',ram:'v-ram',storage:'v-storage'};
function assembled(){
 let s=commandAny(prepared(),{type:'assemble',kind:'pc',name:'サーバー1',parts,purpose:'server',appearance:'graphite',price:300000});
 s=commandAny(s,{type:'advance',days:14});
 s=commandAny(s,{type:'launch',id:'p-1'});
 s=commandAny(s,{type:'line',id:'p-1',target:2});
 return s;
}
it('#3 selling variable-cost purchased competitor parts uses realized inventory costs, not design estimates',()=>{
 const s=assembled();s.day=15;
 // Restock the supplier: market sales during development may have emptied it.
 s.rivals[0].products[0].inventory=20;s.rivals[0].products[0].price=700;const oldCash=s.company.cash;
 manufacture(s);
 expect(s.products[0].inventory).toBe(2);
 const paid=oldCash-s.company.cash;
 expect((s.products[0] as any).inventoryValue).toBe(paid);
 s.products[0].target=3;s.rivals[0].products[0].price=1000;manufacture(s);
 expect((s.products[0] as any).inventoryValue).toBe(paid+1000+(paid/2-700));
 const totalValue=(s.products[0] as any).inventoryValue;
 const price=s.products[0].price;
 sellProducts(s);
 const sold=s.products[0].sold;
 expect(sold).toBeGreaterThan(0);
 expect(s.products[0].profit).toBe(sold*price-(totalValue-(s.products[0] as any).inventoryValue));
 expect(importSave(exportSave(s))).toEqual(s);
});
it('#5 competitor acquisition relinks existing PC BOM to own inventory without duplicate sourcing',()=>{
 let s=assembled();s.company.cash=100_000_000_000;s.products[0].target=10;s.rivals[0].products[0].inventory=20;
 const inputId=s.products[0].spec.cpu;
 const rivalStock=s.rivals[0].products[0].inventory;
 s=commandAny(s,{type:'acquire',id:s.rivals[0].id});
 const own=s.products.find(p=>p.kind==='cpu');
 expect(own).toBeDefined();
 expect(s.products[0].spec.cpu).toBe(own?.id);
 expect(s.products[0].spec.cpu).not.toBe(inputId);
 expect(own?.inventory).toBe(rivalStock);
 const supplier=s.rivals[0];const cash=s.company.cash;const unitsBefore=s.products[0].inventory;
 s.day=15;manufacture(s);
 expect(s.products[0].inventory).toBeGreaterThan(unitsBefore);
 expect(own!.inventory).toBeLessThan(rivalStock);
 expect(supplier.products[0].inventory).toBe(0);
 expect(supplier.cash).toBe(0);
 expect(s.company.cash).toBeLessThan(cash);
 expect(importSave(exportSave(s))).toEqual(s);
});
it('#6 notifications persist unique IDs across same-day identical events and support read acknowledgements',()=>{
 let s=createGame({id:'notify',name:'通知社',difficulty:'normal',seed:1});
 s=commandAny(s,{type:'research',id:'cpu-compute-1'});
 s=commandAny(s,{type:'advance',days:7});
 const notices=(s as any).notifications;
 expect(notices.length).toBeGreaterThan(0);
 expect(notices.some((n:any)=>n.kind==='researchComplete')).toBe(true);
 const last=notices.at(-1).id;
 const saved=importSave(exportSave(s));
 expect((saved as any).notifications).toEqual(notices);
 const read=commandAny(saved,{type:'markNotificationsRead',id:last});
 expect((read as any).notificationReadId).toBe(last);
 expect((commandAny(read,{type:'markNotificationsRead',id:last}) as any).notificationReadId).toBe(last);
 expect((s as any).notificationReadId??0).toBe(0);
});
it('#3 old version-1 inventory without valuation remains valid and takes default manufactured cost',()=>{
 const s=prepared();
 s.research.completed.push('cpu-compute-1');
 const designed=commandAny(s,{type:'design',kind:'cpu',name:'Legacy CPU',spec:defaultSpec('cpu'),price:40000});const cpu=designed.products[0];
 cpu.remaining=0;cpu.launched=true;cpu.inventory=3;cpu.line=true;
 const old=importSave(exportSave(designed));
 expect(old.products[0].inventory).toBe(3);
 const cost=old.products[0].unitCost*3;
 sellProducts(old);
 expect(old.products[0].profit).toBe(old.products[0].sold*old.products[0].price-(cost-(old.products[0] as any).inventoryValue));
});

it('#3 assigning own GPU to AI cluster removes the same proportional stock value',()=>{
 let s=createGame({id:'gpu-stock',name:'自社GPU',difficulty:'normal',seed:1});
 s.research.completed=['gpu-compute-1','ai-compute-1'];
 s=commandAny(s,{type:'design',kind:'gpu',name:'G1',spec:defaultSpec('gpu'),price:60000});
 s=commandAny(s,{type:'advance',days:14});s=commandAny(s,{type:'launch',id:'p-1'});s=commandAny(s,{type:'line',id:'p-1',target:4});
 s=commandAny(s,{type:'advance',days:1});
 const before=s.products[0];const previous=(before as any).inventoryValue;
 const after=commandAny(s,{type:'buyCluster',gpuId:'p-1',serverId:'vendor',gpus:1,network:.8,cooling:.9});
 expect(after.products[0].inventory).toBe(before.inventory-1);
 expect((after.products[0] as any).inventoryValue).toBe(previous-before.unitCost);
 expect(after.clusters[0].purchaseCost).toBe(200000+before.unitCost);
});
