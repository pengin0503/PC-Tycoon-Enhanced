import {it,expect} from 'vitest';
import {createGame,command,advanceInteractive} from '../packages/sim/src/index';
import {defaultSpec} from '../packages/content/src/hardware';
import {evaluateHardware,manufacture} from '../packages/sim/src/hardware';
import {priceRange} from '../packages/sim/src/pricing';
import {importSave,exportSave} from '../packages/save/src/index';
const fresh=()=>createGame({id:'new-features',name:'統合テスト社',difficulty:'normal',seed:91});
const cmd=(s:any,c:any)=>command(s,c);
const gpuDesign={type:'design',kind:'gpu',name:'Own AI GPU',spec:defaultSpec('gpu'),price:60000};

it('quality and performance raise dynamically calculated selling bounds',()=>{
 const base=priceRange({kind:'cpu',unitCost:170,performance:1200,reliability:.9,visual:{tier:0,color:'graphite'}});
 const advanced=priceRange({kind:'cpu',unitCost:170,performance:2400,reliability:1,visual:{tier:2,color:'graphite'}});
 expect(advanced.max).toBeGreaterThan(base.max);
 expect(base.min).toBeGreaterThan(0);expect(base.max).toBeGreaterThan(base.min);
});
it('rejects out-of-band product price edits but accepts old saved prices',()=>{
 let s=fresh();s.research.completed.push('cpu-compute-1');
 s=cmd(s,{type:'design',kind:'cpu',name:'Standard',spec:defaultSpec('cpu'),price:40000});
 expect(()=>cmd(s,{type:'price',id:'p-1',price:1000000})).toThrow(/価格/);
 const old=structuredClone(s);old.products[0].price=1000000;
 expect(importSave(exportSave(old)).products[0].price).toBe(1000000);
});
it('rival parts are bought from limited stock and revenue goes to supplier',()=>{
 let s=fresh();s.research.completed.push('pc-compute-1');
 const metrics=evaluateHardware('cpu',defaultSpec('cpu'),['cpu-compute-1']);
 const rival=s.rivals[0];
 rival.products.push({id:'rival-cpu-1',name:'Rival CPU',kind:'cpu',spec:{...defaultSpec('cpu'),generation:1},...metrics,remaining:0,price:50000,inventory:3,target:10,line:true,launched:true,sold:0,revenue:0,profit:0,releaseDay:0});
 const parts={cpu:'rival-cpu-1',gpu:'v-gpu',motherboard:'v-board',ram:'v-ram',storage:'v-storage'};
 s=cmd(s,{type:'assemble',kind:'pc',name:'Rival workstation',parts,purpose:'server',appearance:'graphite',price:300000});
 s=cmd(s,{type:'advance',days:14});s=cmd(s,{type:'launch',id:'p-1'});s=cmd(s,{type:'line',id:'p-1',target:10});
 // Restock the supplier: market sales during development may have emptied it.
 s.rivals[0].products[0].inventory=3;
 const stock=s.rivals[0].products[0].inventory;
 const before=s.rivals[0].cash;
 const n=structuredClone(s);n.day++;manufacture(n);
 expect(n.products[0].inventory).toBeGreaterThan(0);
 expect(n.rivals[0].products[0].inventory).toBe(stock-n.products[0].inventory);
 expect(n.rivals[0].cash).toBe(before+n.products[0].inventory*50000);
 expect(n.rivals[0].products[0].sold-s.rivals[0].products[0].sold).toBe(n.products[0].inventory);
 expect(importSave(exportSave(n))).toEqual(n);
});
it('AI clusters require GPU production and owned inventory, and use custom servers',()=>{
 let s=fresh();s.research.completed.push('gpu-compute-1','ai-compute-1');
 const cluster=(gpuId:string,serverId='vendor')=>({type:'buyCluster',gpuId,serverId,gpus:1,network:.8,cooling:.9});
 expect(()=>cmd(s,cluster('v-ai-workstation'))).toThrow(/自社GPU/);
 s=cmd(s,gpuDesign);s=cmd(s,{type:'advance',days:14});s=cmd(s,{type:'launch',id:'p-1'});
 expect(()=>cmd(s,cluster('p-1'))).toThrow(/生産/);
 s=cmd(s,{type:'line',id:'p-1',target:10});
 expect(()=>cmd(s,cluster('p-1'))).toThrow(/在庫/);
 s=cmd(s,{type:'advance',days:1});
 const n=cmd(s,cluster('p-1'));
 expect(n.clusters).toHaveLength(1);
 expect(n.products[0].inventory).toBe(s.products[0].inventory-1);
});
it('competitor launches notify once on completion; choices change simulation and survive saves',()=>{
 const s=fresh();const rival=s.rivals[0];
 const metrics=evaluateHardware('cpu',defaultSpec('cpu'),['cpu-compute-1']);
 rival.products.push({id:'new-release',name:'Launch',kind:'cpu',spec:{...defaultSpec('cpu'),generation:1},...metrics,remaining:1,price:50000,inventory:0,target:10,line:true,launched:true,sold:0,revenue:0,profit:0,releaseDay:0});
 const a=cmd(s,{type:'advance',days:7}),b=cmd(a,{type:'advance',days:7});
 expect(a.events.filter(e=>e.kind==='rivalLaunch')).toHaveLength(1);
 expect(b.events.filter(e=>e.kind==='rivalLaunch')).toHaveLength(1);
 const pending={...fresh(),pendingDecision:{id:'supply-boost' as const,title:'生産力の投資',description:'短期契約を購入する',cost:2500}};
 const saved=importSave(exportSave(pending));
 expect(saved.pendingDecision?.id).toBe('supply-boost');
 const invested=cmd(saved,{type:'eventDecision',choice:'invest'});
 const skipped=cmd(saved,{type:'eventDecision',choice:'ignore'});
 expect(invested.pendingDecision).toBeNull();
 expect(invested.company.cash).toBe(skipped.company.cash-2500);
 expect(invested.modifiers.production).toBeGreaterThan(skipped.modifiers.production);
});

it('interactive advancement stops before an unresolved decision and resumes after choice',()=>{
 const s=fresh();
 s.pendingDecision={id:'demand-campaign',title:'購入促進',description:'新規契約',cost:3000};
 expect(advanceInteractive(s,30).day).toBe(0);
 const resolved=cmd(s,{type:'eventDecision',choice:'ignore'});
 expect(advanceInteractive(resolved,1).day).toBe(1);
});
it('historical vendor accelerator clusters remain importable, but new vendor purchases are rejected',()=>{
 const s=fresh();
 s.clusters.push({id:'c-1',gpuId:'v-ai-workstation',serverId:'vendor',gpus:1,peakFlops:2e14,vramBytes:48e9,powerWatts:350,network:.8,cooling:.9,purchaseCost:20000,purchaseDay:s.day});
 const restored=importSave(exportSave(s));expect(restored.clusters[0].gpuId).toBe('v-ai-workstation');
 restored.research.completed=['ai-compute-1'];
 expect(()=>cmd(restored,{type:'buyCluster',gpuId:'v-ai-workstation',serverId:'vendor',gpus:1,network:.8,cooling:.9})).toThrow(/自社GPU/);
});

