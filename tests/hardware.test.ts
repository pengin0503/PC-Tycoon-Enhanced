import {withTestStaff} from './staff-fixture';
const createGame=(...args:Parameters<typeof baseGame>)=>withTestStaff(baseGame(...args),false);
import {it,expect} from 'vitest';
import {createGame as baseGame,command} from '../packages/sim/src/index';
import {unlockBranch} from './research-helpers';
const start=()=>createGame({id:'hw',name:'研究社',difficulty:'normal',seed:42});
const cmd=(s:any,c:any)=>command(s,c);
/** Year-2000 default CPU: one 0.8GHz core on 180nm. */
const cpu={cores:1,clock:.8,ipc:1,process:180,l1Cache:.0625,l2Cache:.125,l3Cache:.0625,cooling:40,socket:'Atlas'};
it('research spends research points, not cash, and completes immediately',()=>{
 const before=start();expect(before.company.researchPoints).toBe(100);
 const s=cmd(before,{type:'research',id:'cpu-compute-1'});expect(s.company.cash).toBe(1000000000);
 expect(s.company.researchPoints).toBe(0);expect(s.research.completed).toContain('cpu-compute-1');expect(before.research.completed).toEqual([]);
 const n=cmd(s,{type:'advance',days:7});expect(n.company.researchPoints).toBe(36);
});
it('research enforces prerequisites, duplicates and available points',()=>{
 expect(()=>cmd(start(),{type:'research',id:'cpu-cores-1'})).toThrow();expect(()=>cmd(start(),{type:'research',id:'unknown'})).toThrow();
 const s=cmd(start(),{type:'research',id:'cpu-compute-1'});expect(()=>cmd(s,{type:'research',id:'cpu-compute-1'})).toThrow();
 expect(()=>cmd(s,{type:'research',id:'cpu-cores-2'})).toThrow();
 expect(()=>cmd(s,{type:'research',id:'gpu-compute-1'})).toThrow(/研究ポイント/);
});
it('design requires research and reflects real tradeoffs',()=>{
 expect(()=>cmd(start(),{type:'design',kind:'cpu',name:'C1',spec:cpu,price:40000})).toThrow();
 const s=cmd(cmd(start(),{type:'research',id:'cpu-compute-1'}),{type:'advance',days:7});
 const p=cmd(s,{type:'design',kind:'cpu',name:'C1',spec:cpu,price:40000}).products[0];
 expect(p.performance).toBe(1200);expect(p.unitCost).toBe(18900);expect(p.power).toBe(31);expect(p.remaining).toBe(20);
 expect(()=>cmd(s,{type:'design',kind:'cpu',name:'C2',spec:{...cpu,cores:2},price:50000})).toThrow(/コア数は現在の研究では1～1コア/);
 const researched=unlockBranch(structuredClone(s),'cpu','cores',1);researched.day=5*360;researched.year=2005;
 const single=cmd(researched,{type:'design',kind:'cpu',name:'C1b',spec:{...cpu,clock:.7,cooling:60},price:50000}).products[0];
 const better=cmd(researched,{type:'design',kind:'cpu',name:'C2',spec:{...cpu,cores:2,clock:.7,cooling:60},price:50000}).products[0];
 expect(better.performance).toBeGreaterThan(single.performance);expect(better.unitCost).toBeGreaterThan(single.unitCost);expect(better.power).toBeGreaterThan(single.power);
 // Core research also moves mass production along: the same two-core design would have cost more without it.
 expect(better.performance).toBeGreaterThan(p.performance);
});
it('cooling must cover the power draw and headroom improves reliability',()=>{
 const s=unlockBranch(unlockBranch(cmd(start(),{type:'research',id:'cpu-compute-1'}),'cpu','clock',3),'cpu','cooling',1);
 s.day=2*360;s.year=2002;
 const hot={...cpu,clock:2.0,cooling:40};
 expect(()=>cmd(s,{type:'design',kind:'cpu',name:'Hot',spec:hot,price:60000})).toThrow(/冷却性能が不足しています（消費電力 78W \/ 冷却性能 40W）/);
 const {cooling:_,...missing}=cpu;
 expect(()=>cmd(s,{type:'design',kind:'cpu',name:'None',spec:missing,price:40000})).toThrow(/冷却性能を指定/);
 const tight=cmd(s,{type:'design',kind:'cpu',name:'Tight',spec:{...hot,cooling:80},price:60000}).products.at(-1)!;
 const roomy=cmd(s,{type:'design',kind:'cpu',name:'Roomy',spec:{...hot,cooling:100},price:60000}).products.at(-1)!;
 expect(roomy.reliability).toBeGreaterThan(tight.reliability);expect(roomy.unitCost).toBeGreaterThan(tight.unitCost);
});
it.each([{...cpu,cores:0},{...cpu,cores:1.5},{...cpu,clock:Infinity},{...cpu,clock:100},{...cpu,socket:'bad'},{...cpu,unexpected:1}])('rejects invalid component specs %j',spec=>{
 const s=cmd(cmd(start(),{type:'research',id:'cpu-compute-1'}),{type:'advance',days:7});expect(()=>cmd(s,{type:'design',kind:'cpu',name:'C',spec,price:40000})).toThrow();
});
it('develops designs with weekly work before release',()=>{
 let s=cmd(cmd(start(),{type:'research',id:'cpu-compute-1'}),{type:'advance',days:7});s=cmd(s,{type:'design',kind:'cpu',name:'C',spec:cpu,price:40000});
 const n=cmd(s,{type:'advance',days:14});expect(n.products[0].remaining).toBe(0);expect(n.products[0].launched).toBe(false);
});
