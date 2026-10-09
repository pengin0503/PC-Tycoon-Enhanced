import {it,expect} from 'vitest';
import {createGame,command} from '../packages/sim/src/index';
import {importSave,exportSave} from '../packages/save/src/index';
import {rivalDaily} from '../packages/sim/src/rivals';
const start=(difficulty:any='normal')=>createGame({id:'rival',name:'競争社',difficulty,seed:8});const cmd=(s:any,c:any)=>command(s,c);
it('rivals independently research develop manufacture and sell',()=>{
 const s=start();const n=cmd(s,{type:'advance',days:180});expect(n.rivals).toHaveLength(9);
 for(const r of n.rivals){expect(r.researchLevel).toBeGreaterThan(0);expect(r.products.length).toBeGreaterThan(0);expect(r.products.reduce((v:any,p:any)=>v+p.sold,0)).toBeGreaterThan(0);expect(r.cash).toBeGreaterThanOrEqual(0);for(const p of r.products)expect(p.inventory).toBeGreaterThanOrEqual(0);}
 expect(s.company.cash-n.company.cash).toBe(1200000);
 expect(n).toEqual(cmd(cmd(importSave(exportSave(s)),{type:'advance',days:90}),{type:'advance',days:90}));
});
it('hard rivals have stronger product efficiency than normal',()=>{
 const normal=cmd(start(),{type:'advance',days:180});const hard=cmd(start('hard'),{type:'advance',days:180});
 expect(hard.rivals[0].products[0].performance).toBeGreaterThan(normal.rivals[0].products[0].performance);
});
it('acquisition transfers assets once with cash conservation',()=>{
 const s=cmd(start(),{type:'advance',days:90});s.company.cash=100_000_000_000;const r=s.rivals[0];
 const n=cmd(s,{type:'acquire',id:r.id});expect(n.rivals[0].acquired).toBe(true);expect(n.rivals[0].cash).toBe(0);
 expect(n.products.length).toBe(r.products.filter((p:any)=>p.remaining===0).length);expect(n.research.completed).toContain('cpu-compute-1');
 expect(n.company.cash).toBe(s.company.cash-n.finance.capital+r.cash);expect(()=>cmd(n,{type:'acquire',id:r.id})).toThrow();
 const none=start();none.company.cash=0;expect(()=>cmd(none,{type:'acquire',id:r.id})).toThrow();expect(none.rivals[0].acquired).toBe(false);
});
it('rival production uses all available lines, rotates priority, and respects stock and cash limits',()=>{
 const evolved=cmd(start(),{type:'advance',days:180});
 const source=evolved.rivals[0].products[0];
 const fixture=(count:number)=>{
  const s=structuredClone(evolved);const r=s.rivals[0];r.cash=100_000_000;r.debt=0;
  r.products=Array.from({length:count},(_,i)=>({...structuredClone(source),id:`test-${i}`,name:`製品${i}`,remaining:0,inventory:0,target:1000}));
  return s;
 };
 const one=fixture(1);rivalDaily(one);expect(one.rivals[0].products[0].inventory).toBe(120);
 const two=fixture(2);rivalDaily(two);expect(two.rivals[0].products.map(p=>p.inventory)).toEqual([60,60]);
 const four=fixture(4);rivalDaily(four);expect(four.rivals[0].products.map(p=>p.inventory)).toEqual([30,30,30,30]);
 const many=fixture(15);rivalDaily(many);expect(many.rivals[0].products.reduce((sum,p)=>sum+p.inventory,0)).toBe(120);
 for(let day=0;day<15;day++){many.day++;rivalDaily(many);}
 expect(many.rivals[0].products.every(p=>p.inventory>0)).toBe(true);
 const capped=fixture(4);capped.rivals[0].products[0].inventory=1000;rivalDaily(capped);
 expect(capped.rivals[0].products.slice(1).reduce((sum,p)=>sum+p.inventory,0)).toBe(120);
 const poor=fixture(4);poor.rivals[0].cash=poor.rivals[0].products[0].unitCost*3;rivalDaily(poor);
 expect(poor.rivals[0].products.reduce((sum,p)=>sum+p.inventory,0)).toBe(3);expect(poor.rivals[0].debt).toBe(0);
 const indebted=fixture(4);indebted.rivals[0].debt=1;rivalDaily(indebted);
 expect(indebted.rivals[0].products.every(p=>p.inventory===0)).toBe(true);
 const repeat=fixture(4);rivalDaily(repeat);expect(repeat.rivals[0].products.map(p=>p.inventory)).toEqual(four.rivals[0].products.map(p=>p.inventory));
});

