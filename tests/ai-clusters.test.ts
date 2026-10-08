import {it,expect} from 'vitest';
import {createGame,command} from '../packages/sim/src/index';
const cmd=(s:any,c:any)=>command(s,c);
it('buys finite compute with capital cost and rejects bad counts',()=>{
 let s=createGame({id:'cluster',name:'AI社',year:2026,difficulty:'normal',seed:1});s=cmd(cmd(s,{type:'research',id:'ai-compute-1'}),{type:'advance',days:7});
 const c={type:'buyCluster',gpuId:'v-ai-workstation',serverId:'vendor',gpus:2,network:.8,cooling:.9};const n=cmd(s,c);
 expect(n.clusters).toHaveLength(1);expect(n.clusters[0].vramBytes).toBe(96e9);expect(n.company.cash).toBe(s.company.cash-38000);expect(n.finance.capital).toBe(38000);
 expect(()=>cmd(s,{...c,gpus:0})).toThrow();expect(()=>cmd(s,{...c,gpuId:'missing'})).toThrow();expect(s.clusters).toEqual([]);
});
it('own GPU transfers stock once and retains its asset value for operating cost',()=>{
 let s=createGame({id:'own',name:'統合社',year:2026,difficulty:'normal',seed:1});s.research.completed.push('ai-compute-1','gpu-compute-1');
 s=cmd(s,{type:'design',kind:'gpu',name:'Own GPU',spec:{units:16,clock:1,vram:8,bandwidth:256},price:450});s=cmd(s,{type:'advance',days:14});s=cmd(s,{type:'launch',id:'p-1'});s=cmd(s,{type:'line',id:'p-1',target:100});s=cmd(s,{type:'advance',days:1});
 const n=cmd(s,{type:'buyCluster',gpuId:'p-1',serverId:'vendor',gpus:1,network:.8,cooling:.9});expect(n.products[0].inventory).toBe(s.products[0].inventory-1);expect(n.clusters[0].purchaseCost).toBe(2000+s.products[0].unitCost);expect(n.finance.capital).toBe(2000);
});
