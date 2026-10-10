import {withTestStaff} from './staff-fixture';
import {it,expect} from 'vitest';
import {createGame,command} from '../packages/sim/src/index';
import {companyValue} from '../packages/sim/src/management';
const start=(difficulty:any='normal')=>createGame({id:'manage',name:'経営社',difficulty,seed:42});const cmd=(s:any,c:any)=>command(s,c);
it('upgrades facilities with actual costs and rejects skipped levels',()=>{
 const s=cmd(start(),{type:'office',level:2});expect(s.officeLevel).toBe(2);expect(s.company.cash).toBeLessThan(1000000000);expect(s.finance.capital).toBeGreaterThan(0);
 expect(()=>cmd(s,{type:'office',level:4})).toThrow();expect(()=>cmd(s,{type:'office',level:11})).toThrow();
 const f=cmd(start(),{type:'factory',level:2});expect(f.factoryLevel).toBe(2);
});
it('workers accelerate research and training increases payroll',()=>{
 const staff=cmd(start(),{type:'hire',role:'research',skill:80});expect(staff.staff).toHaveLength(1);
 const researching=cmd(staff,{type:'research',id:'cpu-compute-1'});const n=cmd(researching,{type:'advance',days:7});expect(n.research.completed).toContain('cpu-compute-1');
 const trained=cmd(staff,{type:'train',id:'e-1'});expect(trained.staff[0].skill).toBe(90);expect(trained.staff[0].salary).toBeGreaterThan(staff.staff[0].salary);
 expect(cmd(staff,{type:'advance',days:30}).finance.expenses-staff.finance.expenses).toBe(800000);
});
it('spends advertising budget to increase awareness then stops if unaffordable',()=>{
 const s=cmd(start(),{type:'marketing',budget:300000});const n=cmd(s,{type:'advance',days:7});expect(n.company.awareness).toBeGreaterThan(s.company.awareness);expect(n.company.cash).toBe(999700000);
 s.company.cash=0;expect(cmd(s,{type:'advance',days:7}).advertising).toBe(0);
});
it('credit has difficulty caps and explicit interest and repayment',()=>{
 const s=cmd(start(),{type:'borrow',amount:10000000});expect(s.company.cash).toBe(1010000000);expect(s.company.loan).toBe(10000000);
 expect(cmd(s,{type:'advance',days:30}).company.cash).toBe(1009700000);
 const repaid=cmd(s,{type:'repay',amount:5000000});expect(repaid.company.loan).toBe(5000000);expect(repaid.company.cash).toBe(1005000000);
 expect(()=>cmd(start('hard'),{type:'borrow',amount:250000001})).toThrow();
});
it('staff slots skill caps and money boundaries are enforced',()=>{
 let s=start();for(let i=0;i<4;i++)s=cmd(s,{type:'hire',role:'engineering',skill:20});expect(()=>cmd(s,{type:'hire',role:'engineering',skill:20})).toThrow();
 expect(()=>cmd(start(),{type:'hire',role:'engineering',skill:101})).toThrow();
 const none=start();none.company.cash=0;expect(()=>cmd(none,{type:'factory',level:2})).toThrow();expect(none.factoryLevel).toBe(1);
});
it('repairs missing or stale staff sequence numbers after layoffs for both hiring paths',()=>{
 const legacy=cmd(cmd(start(),{type:'hire',role:'research',skill:80}),{type:'hire',role:'engineering',skill:70});
 delete (legacy as any).staffSeq;
 const laidOff=cmd(legacy,{type:'fire',id:'e-1'});
 const directlyHired=cmd(laidOff,{type:'hire',role:'marketing',skill:60});
 expect(directlyHired.staff.map((e:any)=>e.id)).toEqual(['e-2','e-3']);
 expect(directlyHired.staffSeq).toBe(3);

 const candidateLegacy=structuredClone(legacy);
 candidateLegacy.staff[0]!.id='e-9';
 candidateLegacy.staff[1]!.id='e-2';
 candidateLegacy.staffSeq=1;
 candidateLegacy.candidates=[{id:'k-1',role:'marketing',skill:55}];
 const candidateLaidOff=cmd(candidateLegacy,{type:'fire',id:'e-9'});
 const candidateHired=cmd(candidateLaidOff,{type:'hireCandidate',id:'k-1'});
 expect(candidateHired.staff.map((e:any)=>e.id)).toEqual(['e-2','e-10']);
 expect(candidateHired.staffSeq).toBe(10);
});
it('values stock at its recorded moving-average cost rather than the design estimate',()=>{
 const ready=withTestStaff(start());ready.research.completed.push('cpu-compute-1');
 const designed=cmd(ready,{type:'design',kind:'cpu',name:'Inventory CPU',spec:{cores:1,clock:.8,ipc:1,process:180,l1Cache:.0625,l2Cache:.125,l3Cache:.0625,cooling:40,socket:'Atlas'},price:40000});
 const empty=structuredClone(designed);const stocked=structuredClone(designed);
 stocked.products[0].inventory=3;(stocked.products[0] as any).inventoryValue=2100;
 expect(companyValue(stocked)-companyValue(empty)).toBe(2100);
});

