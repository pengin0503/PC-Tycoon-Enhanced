import {it,expect} from 'vitest';
import {createGame,command} from '../packages/sim/src/index';
import {importSave,exportSave} from '../packages/save/src/index';
const start=(difficulty:any='normal')=>createGame({id:'rival',name:'競争社',year:2026,difficulty,seed:8});const cmd=(s:any,c:any)=>command(s,c);
it('rivals independently research develop manufacture and sell',()=>{
 const s=start();const n=cmd(s,{type:'advance',days:180});expect(n.rivals).toHaveLength(3);
 for(const r of n.rivals){expect(r.researchLevel).toBeGreaterThan(0);expect(r.products.length).toBeGreaterThan(0);expect(r.products.reduce((v:any,p:any)=>v+p.sold,0)).toBeGreaterThan(0);expect(r.cash).toBeGreaterThanOrEqual(0);for(const p of r.products)expect(p.inventory).toBeGreaterThanOrEqual(0);}
 expect(s.company.cash-n.company.cash).toBe(72000);
 expect(n).toEqual(cmd(cmd(importSave(exportSave(s)),{type:'advance',days:90}),{type:'advance',days:90}));
});
it('hard rivals have stronger product efficiency than normal',()=>{
 const normal=cmd(start(),{type:'advance',days:180});const hard=cmd(start('hard'),{type:'advance',days:180});
 expect(hard.rivals[0].products[0].performance).toBeGreaterThan(normal.rivals[0].products[0].performance);
});
it('acquisition transfers assets once with cash conservation',()=>{
 const s=cmd(start(),{type:'advance',days:90});s.company.cash=2000000;const r=s.rivals[0];
 const n=cmd(s,{type:'acquire',id:r.id});expect(n.rivals[0].acquired).toBe(true);expect(n.rivals[0].cash).toBe(0);
 expect(n.products.length).toBe(r.products.filter((p:any)=>p.remaining===0).length);expect(n.research.completed).toContain('cpu-compute-1');
 expect(n.company.cash).toBe(s.company.cash-n.finance.capital+r.cash);expect(()=>cmd(n,{type:'acquire',id:r.id})).toThrow();
 const none=start();none.company.cash=0;expect(()=>cmd(none,{type:'acquire',id:r.id})).toThrow();expect(none.rivals[0].acquired).toBe(false);
});
