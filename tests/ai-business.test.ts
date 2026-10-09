import {withTestStaff} from './staff-fixture';
const createGame=(...args:Parameters<typeof baseGame>)=>withTestStaff(baseGame(...args),true);
import {it,expect} from 'vitest';
import {createGame as baseGame,command} from '../packages/sim/src/index';
import {importSave,exportSave} from '../packages/save/src/index';
import * as math from '../packages/sim/src/ai-math';
import {aiHardwareBoost} from '../packages/sim/src/ai';
import {aiBalance} from '../packages/content/src/ai';
import {defaultSpec} from '../packages/content/src/hardware';
import {evaluateHardware} from '../packages/sim/src/hardware';
import {unlockBranch,researchTo,frontierSpec} from './research-helpers';
const cmd=(s:any,c:any)=>command(s,c);
const design={architecture:'dense',total:1e9,active:1e9,layers:24,hidden:2048,attention:'standard',context:4096,tokens:1e9,quality:.8,diversity:.8};
function ready(seed=1){
 let s=createGame({id:'ai',name:'AI社',difficulty:'normal',seed});
  s.company.cash=10_000_000_000;
 s=cmd(cmd(s,{type:'research',id:'ai-compute-1'}),{type:'advance',days:7});
 // Language models need GPUs from around 2030: year-2000 cards are far too slow.
 researchTo(s,'gpu',.35);
 const spec=frontierSpec('gpu',s.research.completed);
 // Post-rebalance designs must have physically adequate cooling even at the frontier.
 while(evaluateHardware('gpu',spec,s.research.completed,{stored:true}).power>Number(spec.cooling)&&Number(spec.units)>1)spec.units=Math.max(1,Number(spec.units)/2);
 s=cmd(s,{type:'design',kind:'gpu',name:'Own AI GPU',spec,price:60000});
 s=cmd(s,{type:'advance',days:14});s=cmd(s,{type:'launch',id:'p-1'});
 s=cmd(s,{type:'line',id:'p-1',target:100});s=cmd(s,{type:'advance',days:1});
 return cmd(s,{type:'buyCluster',gpuId:'p-1',serverId:'vendor',gpus:1,network:.8,cooling:.9});
}
const train={type:'trainModel',name:'Polar One',design,clusterId:'c-1',budget:1000000};
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
it('model size, context and data limits open up through AI research instead of being available from the start',()=>{
 const s=ready();
 expect(()=>cmd(s,{...train,design:{...design,context:16384},budget:1e9})).toThrow('学習コンテキスト長は現在の研究では8,192トークンまでです');
 expect(()=>cmd(s,{...train,design:{...design,tokens:100e9},budget:1e9})).toThrow('学習トークン数は現在の研究では50Bまでです');
 const researched=unlockBranch(structuredClone(s),'ai','context',10);
 expect(cmd(researched,{...train,design:{...design,context:16384},budget:1e9}).models[0].design.context).toBe(16384);
});
it('benchmarks saturate and data quality is consequential',()=>{
 const benchmark=(math as any).benchmarks;expect(benchmark).toBeTypeOf('function');const low=benchmark({...design,quality:.2}),high=benchmark(design);expect(high.math).toBeGreaterThan(low.math);
 for(const score of Object.values(benchmark({...design,tokens:1e13})))expect(score).toBeLessThan(100);
 // failure is seeded: poor data fails on some seeds, good data on none
 const outcome=(seed:number,quality:number)=>cmd(cmd(ready(seed),{...train,design:{...design,quality,diversity:quality}}),{type:'advance',days:7}).models[0].status;
 const seeds=Array.from({length:30},(_,i)=>i+1);
 expect(seeds.some(seed=>outcome(seed,.1)==='failed')).toBe(true);expect(seeds.every(seed=>outcome(seed,.8)!=='failed')).toBe(true);
});
it('subscriptions charge monthly and open weights improve reputation without API revenue',()=>{
 const trained=cmd(cmd(ready(),train),{type:'advance',days:7});
 const subscription=cmd(cmd(trained,{...deploy,mode:'subscription'}),{type:'advance',days:30});expect(subscription.models[0].service!.users).toBeGreaterThan(0);expect(subscription.models[0].service!.revenue).toBeGreaterThan(0);
 const open=cmd(cmd(trained,{...deploy,mode:'open'}),{type:'advance',days:30});expect(open.company.reputation).toBeGreaterThan(trained.company.reputation);expect(open.models[0].service!.revenue).toBe(0);expect(open.models[0].service!.cost).toBe(0);
 expect(open.models[0].service!.subscriptionUserDays).toBe(0);
});
it('subscription billing prorates user-days and settles earned revenue on stop, repricing, and save restore',()=>{
 const trained=cmd(cmd(ready(),train),{type:'advance',days:7});
 let oneDay=cmd(trained,{...deploy,mode:'subscription'});
 oneDay.day=59;
 oneDay=cmd(oneDay,{type:'advance',days:1});
 const afterOneDay=oneDay.models[0].service!;
 expect(afterOneDay.subscriptionUserDays).toBe(0);
 expect(afterOneDay.revenue).toBe(Math.round(afterOneDay.users*500/30*(1-aiBalance.fee-aiBalance.refund)));

 let partial=cmd(trained,{...deploy,mode:'subscription'});
 partial.day=30;
 partial=cmd(partial,{type:'advance',days:29});
 partial=importSave(exportSave(partial));
 const accrued=partial.models[0].service!.subscriptionUserDays;
 expect(accrued).toBeGreaterThan(0);
 const expectedOldRate=Math.round(accrued*500/30*(1-aiBalance.fee-aiBalance.refund));
 const repriced=cmd(partial,{...deploy,mode:'subscription',subscriptionPrice:750});
 expect(repriced.models[0].service!.revenue).toBe(expectedOldRate);
 expect(repriced.models[0].service!.subscriptionUserDays).toBe(0);
 const stopped=cmd(partial,{type:'retireModel',id:'m-1'}).models[0].service!;
 expect(stopped.revenue).toBe(expectedOldRate);expect(stopped.subscriptionUserDays).toBe(0);

 const beforeRetire=cmd(trained,{...deploy,mode:'subscription'});
 beforeRetire.day=30;
 const earning=cmd(beforeRetire,{type:'advance',days:1});
 const earnedDays=earning.models[0].service!.subscriptionUserDays;
 const retired=cmd(earning,{type:'retireModel',id:'m-1'}).models[0].service!;
 expect(retired.enabled).toBe(false);
 expect(retired.revenue).toBe(Math.round(earnedDays*500/30*(1-aiBalance.fee-aiBalance.refund)));
 expect(retired.subscriptionUserDays).toBe(0);

 const forSwitch=cmd(trained,{...deploy,mode:'subscription'});
 forSwitch.day=30;
 const accruedBeforeSwitch=cmd(forSwitch,{type:'advance',days:1});
 const pending=accruedBeforeSwitch.models[0].service!.subscriptionUserDays;
 const switched=cmd(accruedBeforeSwitch,{...deploy,mode:'api'});
 expect(switched.models[0].service!.subscriptionUserDays).toBe(0);
 expect(switched.models[0].service!.revenue).toBe(Math.round(pending*500/30*(1-aiBalance.fee-aiBalance.refund)));

 const debtStopped=cmd(trained,{...deploy,mode:'subscription'});
 debtStopped.day=30;debtStopped.company.debt=1;
 const stoppedByDebt=cmd(debtStopped,{type:'advance',days:1}).models[0].service!;
 expect(stoppedByDebt.enabled).toBe(false);
 expect(stoppedByDebt.subscriptionUserDays).toBe(0);
 expect(stoppedByDebt.revenue).toBeGreaterThan(0);
});
it('quantization is researched and founder work is shared',()=>{
 let s=ready();s.company.researchPoints=10000;s=cmd(s,train);s=cmd(s,{type:'research',id:'ai-quantization-1'});expect(s.research.completed).toContain('ai-quantization-1');
 // a concurrent hardware design splits the founder's weekly work with model preparation/training
 const busy=cmd(cmd(s,{type:'design',kind:'gpu',name:'Next',spec:defaultSpec('gpu'),price:8000}),{type:'advance',days:7});const solo=cmd(s,{type:'advance',days:7});
 expect(busy.models[0].remainingSeconds+busy.models[0].preparationRemaining).toBeGreaterThan(solo.models[0].remainingSeconds+solo.models[0].preparationRemaining);
 const done=cmd(solo,{type:'advance',days:14});expect(done.models[0].status).toBe('ready');expect(cmd(done,{...deploy,bits:4}).models[0].service!.bits).toBe(4);
 const noTech=cmd(cmd(ready(),train),{type:'advance',days:7});expect(()=>cmd(noTech,{...deploy,bits:4})).toThrow();
});
it('private evaluations do not boost sales until model commercialization',()=>{
 const trained=cmd(cmd(ready(),train),{type:'advance',days:7});expect(aiHardwareBoost(trained)).toBe(0);
 expect(aiHardwareBoost(cmd(trained,{...deploy,mode:'open'}))).toBeGreaterThan(0);
});

