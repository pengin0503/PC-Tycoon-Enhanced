import {it,expect} from 'vitest';
import {createGame,command} from '../packages/sim/src/index';
const cmd=(s:any,c:any)=>command(s,c);
it('buys finite compute with capital cost and rejects bad counts',()=>{
 let s=createGame({id:'cluster',name:'AI社',year:2026,difficulty:'normal',seed:1});s=cmd(cmd(s,{type:'research',id:'ai-compute-1'}),{type:'advance',days:7});
 const c={type:'buyCluster',gpuId:'v-ai-workstation',serverId:'vendor',gpus:2,network:.8,cooling:.9};const n=cmd(s,c);
 expect(n.clusters).toHaveLength(1);expect(n.clusters[0].vramBytes).toBe(96e9);expect(n.company.cash).toBe(s.company.cash-38000);expect(n.finance.capital).toBe(38000);
 expect(()=>cmd(s,{...c,gpus:0})).toThrow();expect(()=>cmd(s,{...c,gpuId:'missing'})).toThrow();expect(s.clusters).toEqual([]);
});
