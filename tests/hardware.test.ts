import {it,expect} from 'vitest';
import {createGame,command} from '../packages/sim/src/index';
import {unlockBranch} from './research-helpers';
const start=()=>createGame({id:'hw',name:'研究社',year:2026,difficulty:'normal',seed:42});
const cmd=(s:any,c:any)=>command(s,c);
const cpu={cores:4,clock:3,ipc:1,process:14,cooling:40,socket:'Atlas'};
it('research spends research points, not cash, and completes immediately',()=>{
 const before=start();expect(before.company.researchPoints).toBe(100);
 const s=cmd(before,{type:'research',id:'cpu-compute-1'});expect(s.company.cash).toBe(500000);
 expect(s.company.researchPoints).toBe(0);expect(s.research.completed).toContain('cpu-compute-1');expect(before.research.completed).toEqual([]);
 const n=cmd(s,{type:'advance',days:7});expect(n.company.researchPoints).toBe(100);
});
it('research enforces prerequisites, duplicates and available points',()=>{
 expect(()=>cmd(start(),{type:'research',id:'cpu-compute-2'})).toThrow();expect(()=>cmd(start(),{type:'research',id:'unknown'})).toThrow();
 const s=cmd(start(),{type:'research',id:'cpu-compute-1'});expect(()=>cmd(s,{type:'research',id:'cpu-compute-1'})).toThrow();
 expect(()=>cmd(s,{type:'research',id:'gpu-compute-1'})).toThrow(/研究ポイント/);
});
it('design requires research and reflects real tradeoffs',()=>{
 expect(()=>cmd(start(),{type:'design',kind:'cpu',name:'C1',spec:cpu,price:400})).toThrow();
 const s=cmd(cmd(start(),{type:'research',id:'cpu-compute-1'}),{type:'advance',days:7});
 const p=cmd(s,{type:'design',kind:'cpu',name:'C1',spec:cpu,price:400}).products[0];
 expect(p.performance).toBe(1200);expect(p.unitCost).toBe(190);expect(p.remaining).toBe(20);
 expect(()=>cmd(s,{type:'design',kind:'cpu',name:'C2',spec:{...cpu,cores:8},price:500})).toThrow(/コア数は現在の研究では1～4コア/);
 const researched=unlockBranch(structuredClone(s),'cpu','capacity',2);
 const better=cmd(researched,{type:'design',kind:'cpu',name:'C2',spec:{...cpu,cores:8,cooling:60},price:500}).products[0];
 expect(better.performance).toBeGreaterThan(p.performance);expect(better.unitCost).toBeGreaterThan(p.unitCost);expect(better.power).toBeGreaterThan(p.power);
});
it('cooling must cover the power draw and headroom improves reliability',()=>{
 const s=unlockBranch(cmd(start(),{type:'research',id:'cpu-compute-1'}),'cpu','compute',3);
 const hot={...cpu,clock:3.6,cooling:20};
 expect(()=>cmd(s,{type:'design',kind:'cpu',name:'Hot',spec:hot,price:400})).toThrow(/冷却性能が不足しています（消費電力 31W \/ 冷却性能 20W）/);
 const {cooling:_,...missing}=cpu;
 expect(()=>cmd(s,{type:'design',kind:'cpu',name:'None',spec:missing,price:400})).toThrow(/冷却性能を指定/);
 const tight=cmd(s,{type:'design',kind:'cpu',name:'Tight',spec:{...hot,cooling:35},price:400}).products.at(-1)!;
 const roomy=cmd(s,{type:'design',kind:'cpu',name:'Roomy',spec:{...hot,cooling:40},price:400}).products.at(-1)!;
 expect(roomy.reliability).toBeGreaterThan(tight.reliability);expect(roomy.unitCost).toBeGreaterThan(tight.unitCost);
});
it.each([{...cpu,cores:0},{...cpu,cores:1.5},{...cpu,clock:Infinity},{...cpu,clock:100},{...cpu,socket:'bad'},{...cpu,unexpected:1}])('rejects invalid component specs %j',spec=>{
 const s=cmd(cmd(start(),{type:'research',id:'cpu-compute-1'}),{type:'advance',days:7});expect(()=>cmd(s,{type:'design',kind:'cpu',name:'C',spec,price:400})).toThrow();
});
it('develops designs with weekly work before release',()=>{
 let s=cmd(cmd(start(),{type:'research',id:'cpu-compute-1'}),{type:'advance',days:7});s=cmd(s,{type:'design',kind:'cpu',name:'C',spec:cpu,price:400});
 const n=cmd(s,{type:'advance',days:14});expect(n.products[0].remaining).toBe(0);expect(n.products[0].launched).toBe(false);
});
