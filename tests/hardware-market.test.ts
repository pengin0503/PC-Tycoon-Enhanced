import {it,expect} from 'vitest';
import {createGame,command} from '../packages/sim/src/index';
import {defaultSpec} from '../packages/content/src/hardware';
import {importSave,exportSave} from '../packages/save/src/index';
import {priceRange} from '../packages/sim/src/pricing';
const cmd=(s:any,c:any)=>command(s,c);
function developed(kind:any='cpu'){
 let s=createGame({id:'market',name:'製品社',year:2026,difficulty:'normal',seed:42});
 s=cmd(s,{type:'research',id:`${kind}-compute-1`});s=cmd(s,{type:'advance',days:7});
 s=cmd(s,{type:'design',kind,name:'第一世代',spec:defaultSpec(kind),price:400});return cmd(s,{type:'advance',days:14});
}
function released(){let s=cmd(developed(),{type:'launch',id:'p-1'});return cmd(s,{type:'line',id:'p-1',target:100});}
it('manufactures inventory then sells with positive unit economics',()=>{
 const s=released();const n=cmd(s,{type:'advance',days:7});expect(n.products[0].sold).toBeGreaterThan(0);expect(n.products[0].profit).toBeGreaterThan(0);
 expect(n.products[0].inventory).toBeGreaterThanOrEqual(0);expect(n.finance.revenue).toBe(n.products[0].revenue);
 expect(cmd(s,{type:'advance',days:180}).company.cash).toBeGreaterThan(500000);
});
it('rejects developing releases and invalid target or price',()=>{
 const s=developed();for(const c of [{type:'line',id:'p-1',target:100},{type:'price',id:'p-1',price:0},{type:'line',id:'bad',target:2}])expect(()=>cmd(s,c)).toThrow();
 const developing={...s,products:s.products.map(p=>({...p,remaining:1}))};expect(()=>cmd(developing,{type:'launch',id:'p-1'})).toThrow();
});
it('does not manufacture using nonexistent cash',()=>{
 const s=released();s.company.cash=0;const n=cmd(s,{type:'advance',days:1});expect(n.products[0].inventory).toBe(0);expect(n.company.cash).toBe(0);
});
it('sales reflect price elasticity and replay exactly after restore',()=>{
 const s=released();const expensive=cmd(s,{type:'price',id:'p-1',price:priceRange(s.products[0]).max});
 const normal=cmd(s,{type:'advance',days:70});expect(normal.products[0].sold).toBeGreaterThan(cmd(expensive,{type:'advance',days:70}).products[0].sold);
 expect(normal).toEqual(cmd(importSave(exportSave(s)),{type:'advance',days:70}));
});
it.each(['cpu','gpu','motherboard','ram','storage'])('all %s families produce valid designs',kind=>{
 const s=developed(kind);expect(s.products[0].unitCost).toBeGreaterThan(0);expect(s.products[0].performance).toBeGreaterThan(0);
});
