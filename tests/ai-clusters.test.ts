import {it,expect} from 'vitest';
import {createGame,command} from '../packages/sim/src/index';
import {defaultSpec} from '../packages/content/src/hardware';
const cmd=(s:any,c:any)=>command(s,c);
function ownGPUReady(){
 let s=createGame({id:'own',name:'AI社',year:2026,difficulty:'normal',seed:1});
 s.research.completed=['ai-compute-1','gpu-compute-1'];
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
 s=cmd(s,{type:'design',kind:'gpu',name:'Own GPU',spec:{units:16,clock:1,vram:8,bandwidth:256},price:450});s=cmd(s,{type:'advance',days:14});s=cmd(s,{type:'launch',id:'p-1'});s=cmd(s,{type:'line',id:'p-1',target:100});s=cmd(s,{type:'advance',days:1});
 const n=cmd(s,{type:'buyCluster',gpuId:'p-1',serverId:'vendor',gpus:1,network:.8,cooling:.9});expect(n.products[0].inventory).toBe(s.products[0].inventory-1);expect(n.clusters[0].purchaseCost).toBe(2000+s.products[0].unitCost);expect(n.finance.capital).toBe(2000);
});
