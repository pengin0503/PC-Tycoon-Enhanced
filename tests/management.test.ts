import {it,expect} from 'vitest';
import {createGame,command} from '../packages/sim/src/index';
const start=(difficulty:any='normal')=>createGame({id:'manage',name:'経営社',year:2026,difficulty,seed:42});const cmd=(s:any,c:any)=>command(s,c);
it('upgrades facilities with actual costs and rejects skipped levels',()=>{
 const s=cmd(start(),{type:'office',level:2});expect(s.officeLevel).toBe(2);expect(s.company.cash).toBeLessThan(500000);expect(s.finance.capital).toBeGreaterThan(0);
 expect(()=>cmd(s,{type:'office',level:4})).toThrow();expect(()=>cmd(s,{type:'office',level:11})).toThrow();
 const f=cmd(start(),{type:'factory',level:2});expect(f.factoryLevel).toBe(2);
});
it('workers accelerate research and training increases payroll',()=>{
 const staff=cmd(start(),{type:'hire',role:'research',skill:80});expect(staff.staff).toHaveLength(1);
 const researching=cmd(staff,{type:'research',id:'cpu-compute-1'});const n=cmd(researching,{type:'advance',days:7});expect(n.research.completed).toContain('cpu-compute-1');
 const trained=cmd(staff,{type:'train',id:'e-1'});expect(trained.staff[0].skill).toBe(90);expect(trained.staff[0].salary).toBeGreaterThan(staff.staff[0].salary);
 expect(cmd(staff,{type:'advance',days:30}).finance.expenses-staff.finance.expenses).toBe(14400);
});
it('spends advertising budget to increase awareness then stops if unaffordable',()=>{
 const s=cmd(start(),{type:'marketing',budget:3000});const n=cmd(s,{type:'advance',days:7});expect(n.company.awareness).toBeGreaterThan(s.company.awareness);expect(n.company.cash).toBe(497000);
 s.company.cash=0;expect(cmd(s,{type:'advance',days:7}).advertising).toBe(0);
});
it('credit has difficulty caps and explicit interest and repayment',()=>{
 const s=cmd(start(),{type:'borrow',amount:100000});expect(s.company.cash).toBe(600000);expect(s.company.loan).toBe(100000);
 expect(cmd(s,{type:'advance',days:30}).company.cash).toBe(587000);
 const repaid=cmd(s,{type:'repay',amount:50000});expect(repaid.company.loan).toBe(50000);expect(repaid.company.cash).toBe(550000);
 expect(()=>cmd(start('hard'),{type:'borrow',amount:100001})).toThrow();
});
it('staff slots skill caps and money boundaries are enforced',()=>{
 let s=start();for(let i=0;i<4;i++)s=cmd(s,{type:'hire',role:'engineering',skill:20});expect(()=>cmd(s,{type:'hire',role:'engineering',skill:20})).toThrow();
 expect(()=>cmd(start(),{type:'hire',role:'engineering',skill:101})).toThrow();
 const none=start();none.company.cash=0;expect(()=>cmd(none,{type:'factory',level:2})).toThrow();expect(none.factoryLevel).toBe(1);
});
