import {withTestStaff} from './staff-fixture';
const createGame=(...args:Parameters<typeof baseGame>)=>withTestStaff(baseGame(...args),false);
import {it,expect} from 'vitest';
import {createGame as baseGame,command} from '../packages/sim/src/index';
const cmd=(s:any,c:any)=>command(s,c);const parts={cpu:'v-cpu',gpu:'v-gpu',motherboard:'v-board',ram:'v-ram',storage:'v-storage'};
function ready(kind='pc'){let s=createGame({id:'dev',name:'端末社',difficulty:'normal',seed:42});return cmd(cmd(s,{type:'research',id:`${kind}-compute-1`}),{type:'advance',days:7});}
const assembly=(kind='pc',purpose='gaming',selected=parts)=>({type:'assemble',kind,name:'Polar Station',parts:selected,purpose,appearance:'graphite',price:300000});
it('assembles purpose-specific compatible devices',()=>{
 let s=ready();s.research.completed.push('cpu-compute-1');
 s=cmd(s,{type:'design',kind:'cpu',name:'Compute',spec:{cores:1,clock:1,ipc:1,process:180,cache:.5,cooling:60,socket:'Atlas'},price:50000});s=cmd(s,{type:'advance',days:14});
 const selected={...parts,cpu:'p-1'};
 const gaming=cmd(s,assembly('pc','gaming',selected)).products[1];const office=cmd(s,assembly('pc','office',selected)).products[1];
 expect(gaming.unitCost).toBeGreaterThan(1000);expect(gaming.performance).not.toBe(office.performance);expect(gaming.spec.appearance).toBe('graphite');
 const server=cmd(s,assembly('pc','server',selected)).products[1];expect(server.performance).not.toBe(gaming.performance);
});
it('rejects incompatible or wrong-category parts',()=>{
 const s=ready();for(const change of [{cpu:'v-cpu-nova'},{ram:'v-ram-ddr5'},{cpu:'v-gpu'},{storage:'missing'}])expect(()=>cmd(s,assembly('pc','gaming',{...parts,...change}))).toThrow();
});
it('case cooling must cover the parts, is research limited, priced and stored with the design',()=>{
 const s=ready();
 expect(()=>cmd(s,{...assembly(),cooling:50})).toThrow(/冷却性能が不足しています（消費電力 62W \/ 冷却性能 50W）/);
 expect(()=>cmd(s,{...assembly(),cooling:400})).toThrow(/冷却性能は現在の研究では30～200W/);
 const small=cmd(s,{...assembly(),cooling:70}).products[0],large=cmd(s,{...assembly(),cooling:200}).products[0];
 expect(large.unitCost).toBeGreaterThan(small.unitCost);expect(large.reliability).toBeGreaterThan(small.reliability);expect(large.spec.cooling).toBe(200);
 const laptop=ready('laptop');expect(()=>cmd(laptop,{...assembly('laptop'),cooling:150})).toThrow(/10～80W/);
 // Cost research discounts the case cooler together with the rest of the case overhead.
 const cheaper=ready();cheaper.research.completed.push('pc-cost-1','pc-cost-2','pc-cost-3');
 const coolerCost=(state:any)=>cmd(state,{...assembly(),cooling:200}).products[0].unitCost-cmd(state,{...assembly(),cooling:70}).products[0].unitCost;
 expect(coolerCost(cheaper)).toBeLessThan(coolerCost(s));
});
it('laptop packaging has a cost and cooling tradeoff',()=>{
 const pc=cmd(ready(),assembly()).products[0];const laptop=cmd(ready('laptop'),assembly('laptop')).products[0];
 expect(laptop.unitCost).toBeGreaterThan(pc.unitCost);expect(laptop.performance).toBeLessThan(pc.performance);
});
it('monitor choices affect performance cost and appearance',()=>{
 const s=ready('monitor');const d=(resolution:number,refresh:number)=>cmd(s,{type:'design',kind:'monitor',name:'Vista',spec:{resolution,refresh,gamut:70,appearance:'silver'},price:60000}).products[0];
 const basic=d(768,60),premium=d(1024,75);
 expect(()=>d(2160,144)).toThrow(/現在の研究では/);expect(premium.unitCost).toBeGreaterThan(basic.unitCost);expect(premium.performance).toBeGreaterThan(basic.performance);
 expect(()=>d(0,60)).toThrow();
});
it('assembly consumes own component stock and pays only unowned inputs',()=>{
 let s=ready();s.research.completed.push('cpu-compute-1');s=cmd(s,{type:'design',kind:'cpu',name:'Own CPU',spec:{cores:1,clock:.8,ipc:1,process:180,cache:.25,cooling:40,socket:'Atlas'},price:40000});s=cmd(s,{type:'advance',days:14});
 s=cmd(s,assembly('pc','gaming',{...parts,cpu:'p-1'}));s=cmd(s,{type:'advance',days:14});s=cmd(s,{type:'launch',id:'p-2'});s=cmd(s,{type:'line',id:'p-2',target:100});
 expect(cmd(s,{type:'advance',days:1}).products[1].inventory).toBe(0);
 s=cmd(s,{type:'launch',id:'p-1'});s.products[0].inventory=5;const n=cmd(s,{type:'advance',days:1});expect(n.products[0].inventory).toBe(0);expect(n.products[1].inventory).toBe(5);
 expect(s.company.cash-n.company.cash).toBe(5*(s.products[1].unitCost-s.products[0].unitCost));
});
