import {it,expect} from 'vitest';
import {createGame,command} from '../packages/sim/src/index';
import {defaultSpec} from '../packages/content/src/hardware';
import {unlockBranch} from './research-helpers';
const cmd=(s:any,c:any)=>command(s,c);
function ownGPUReady(){
 let s=createGame({id:'own',name:'AI社',year:2026,difficulty:'normal',seed:1});
 s.research.completed=['ai-compute-1','gpu-compute-1'];unlockBranch(s,'gpu','capacity',5);
 s=cmd(s,{type:'design',kind:'gpu',name:'Own GPU',spec:{...defaultSpec('gpu'),vram:32},price:600});
 s=cmd(s,{type:'advance',days:14});
 s=cmd(s,{type:'launch',id:'p-1'});s=cmd(s,{type:'line',id:'p-1',target:100});
 return cmd(s,{type:'advance',days:1});
}
it('buys finite compute with capital cost and rejects bad counts',()=>{
 const s=ownGPUReady();
 const c={type:'buyCluster',gpuId:'p-1',serverId:'vendor',gpus:2,network:.8,cooling:.9};const n=cmd(s,c);
 expect(()=>cmd(s,{...c,gpuId:'v-ai-workstation'})).toThrow(/自社GPU/);
 expect(n.clusters).toHaveLength(1);expect(n.clusters[0].vramBytes).toBe(64e9);expect(n.company.cash).toBe(s.company.cash-2000);expect(n.finance.capital-s.finance.capital).toBe(2000);
 expect(()=>cmd(s,{...c,gpus:0})).toThrow();expect(()=>cmd(s,{...c,gpuId:'missing'})).toThrow();expect(s.clusters).toEqual([]);
});
it('own GPU transfers stock once and retains its asset value for operating cost',()=>{
 let s=createGame({id:'own',name:'統合社',year:2026,difficulty:'normal',seed:1});s.research.completed=['ai-compute-1','gpu-compute-1'];
 s=cmd(s,{type:'design',kind:'gpu',name:'Own GPU',spec:{units:16,clock:1,vram:8,bandwidth:256,cooling:80},price:450});s=cmd(s,{type:'advance',days:14});s=cmd(s,{type:'launch',id:'p-1'});s=cmd(s,{type:'line',id:'p-1',target:100});s=cmd(s,{type:'advance',days:1});
 const n=cmd(s,{type:'buyCluster',gpuId:'p-1',serverId:'vendor',gpus:1,network:.8,cooling:.9});expect(n.products[0].inventory).toBe(s.products[0].inventory-1);expect(n.clusters[0].purchaseCost).toBe(2000+s.products[0].unitCost);expect(n.finance.capital).toBe(2000);
});

it('assigns a server built from own and generic components together with an own GPU to AI cluster',()=>{
 let s=ownGPUReady();
 s.research.completed.push('pc-compute-1');
 s=cmd(s,{type:'assemble',kind:'pc',name:'In-house server',parts:{cpu:'v-cpu',gpu:'p-1',motherboard:'v-board',ram:'v-ram',storage:'v-storage'},purpose:'server',appearance:'graphite',price:3000});
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
