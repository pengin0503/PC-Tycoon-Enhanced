import {it,expect} from 'vitest';
import {createGame,command} from '../packages/sim/src/index';
import {importSave,exportSave} from '../packages/save/src/index';
import * as math from '../packages/sim/src/ai-math';
import {aiHardwareBoost} from '../packages/sim/src/ai';
import {defaultSpec} from '../packages/content/src/hardware';
const cmd=(s:any,c:any)=>command(s,c);
const design={architecture:'dense',total:1e9,active:1e9,layers:24,hidden:2048,attention:'standard',context:4096,tokens:1e9,quality:.8,diversity:.8};
function ready(){
 let s=createGame({id:'ai',name:'AI社',year:2026,difficulty:'normal',seed:1});
 s=cmd(cmd(s,{type:'research',id:'ai-compute-1'}),{type:'advance',days:7});
 s.research.completed.push('gpu-compute-1');
 s=cmd(s,{type:'design',kind:'gpu',name:'Own AI GPU',spec:{...defaultSpec('gpu'),vram:32},price:600});
 s=cmd(s,{type:'advance',days:14});s=cmd(s,{type:'launch',id:'p-1'});
 s=cmd(s,{type:'line',id:'p-1',target:100});s=cmd(s,{type:'advance',days:1});
 return cmd(s,{type:'buyCluster',gpuId:'p-1',serverId:'vendor',gpus:1,network:.8,cooling:.9});
}
const train={type:'trainModel',name:'Polar One',design,clusterId:'c-1',budget:10000};
const deploy={type:'deployModel',id:'m-1',clusterId:'c-1',bits:16,context:4096,batch:1,mode:'api',apiPrice:1000,subscriptionPrice:500};
it('trains evaluates and serves finite API demand with actual costs',()=>{
 let s=cmd(ready(),train);expect(s.models[0].status).toBe('training');s=cmd(s,{type:'advance',days:7});expect(s.models[0].status).toBe('ready');
 const host=cmd(s,deploy);const n=cmd(host,{type:'advance',days:30});const service=n.models[0].service!;expect(service.tokens).toBeGreaterThan(0);expect(service.revenue).toBeGreaterThan(service.cost);expect(n.finance.revenue).toBeGreaterThan(0);expect(service.cost).toBeGreaterThan(0);
 expect(n).toEqual(cmd(importSave(exportSave(host)),{type:'advance',days:30}));
});
it('budget VRAM and reservations reject atomically',()=>{
 const s=ready();expect(()=>cmd(s,{...train,budget:1})).toThrow();expect(()=>cmd(s,{...train,design:{...design,architecture:'moe',total:8e9}})).toThrow();
 const busy=cmd(s,train);expect(()=>cmd(busy,train)).toThrow();expect(s.models).toEqual([]);expect(s.company.cash).toBeGreaterThan(0);
});
it('benchmarks saturate and data quality is consequential',()=>{
 const benchmark=(math as any).benchmarks;expect(benchmark).toBeTypeOf('function');const low=benchmark({...design,quality:.2}),high=benchmark(design);expect(high.math).toBeGreaterThan(low.math);
 for(const score of Object.values(benchmark({...design,tokens:1e13})))expect(score).toBeLessThan(100);
 const lowData=cmd(cmd(ready(),{...train,design:{...design,quality:.1,diversity:.1}}),{type:'advance',days:7});expect(lowData.models[0].status).toBe('failed');
});
it('subscriptions charge monthly and open weights improve reputation without API revenue',()=>{
 const trained=cmd(cmd(ready(),train),{type:'advance',days:7});
 const subscription=cmd(cmd(trained,{...deploy,mode:'subscription'}),{type:'advance',days:30});expect(subscription.models[0].service!.users).toBeGreaterThan(0);expect(subscription.models[0].service!.revenue).toBeGreaterThan(0);
 const open=cmd(cmd(trained,{...deploy,mode:'open'}),{type:'advance',days:30});expect(open.company.reputation).toBeGreaterThan(trained.company.reputation);expect(open.models[0].service!.revenue).toBe(0);expect(open.models[0].service!.cost).toBe(0);
});
it('quantization is researched and founder work is shared',()=>{
 let s=ready();s=cmd(s,train);s=cmd(s,{type:'research',id:'ai-quantization-1'});const week=cmd(s,{type:'advance',days:7});expect(week.models[0].status).toBe('training');
 const done=cmd(week,{type:'advance',days:14});expect(done.models[0].status).toBe('ready');expect(cmd(done,{...deploy,bits:4}).models[0].service!.bits).toBe(4);
 const noTech=cmd(cmd(ready(),train),{type:'advance',days:7});expect(()=>cmd(noTech,{...deploy,bits:4})).toThrow();
});
it('private evaluations do not boost sales until model commercialization',()=>{
 const trained=cmd(cmd(ready(),train),{type:'advance',days:7});expect(aiHardwareBoost(trained)).toBe(0);
 expect(aiHardwareBoost(cmd(trained,{...deploy,mode:'open'}))).toBeGreaterThan(0);
});
