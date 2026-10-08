import {it,expect} from 'vitest';
import {createGame,command} from '../packages/sim/src/index';
const cmd=(s:any,c:any)=>command(s,c);const parts={cpu:'v-cpu',gpu:'v-gpu',motherboard:'v-board',ram:'v-ram',storage:'v-storage'};
function ready(kind='pc'){let s=createGame({id:'dev',name:'端末社',year:2026,difficulty:'normal',seed:42});return cmd(cmd(s,{type:'research',id:`${kind}-compute-1`}),{type:'advance',days:7});}
const assembly=(kind='pc',purpose='gaming',selected=parts)=>({type:'assemble',kind,name:'Polar Station',parts:selected,purpose,appearance:'graphite',price:3000});
it('assembles purpose-specific compatible devices',()=>{
 let s=ready();s.research.completed.push('cpu-compute-1');
 s=cmd(s,{type:'design',kind:'cpu',name:'Compute',spec:{cores:4,clock:3.2,ipc:1.2,process:14,cooling:40,socket:'Atlas'},price:800});s=cmd(s,{type:'advance',days:14});
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
 expect(()=>cmd(s,{...assembly(),cooling:80})).toThrow(/冷却性能が不足しています（消費電力 90W \/ 冷却性能 80W）/);
 expect(()=>cmd(s,{...assembly(),cooling:400})).toThrow(/冷却性能は現在の研究では50～250W/);
 const small=cmd(s,{...assembly(),cooling:90}).products[0],large=cmd(s,{...assembly(),cooling:200}).products[0];
 expect(large.unitCost).toBeGreaterThan(small.unitCost);expect(large.reliability).toBeGreaterThan(small.reliability);expect(large.spec.cooling).toBe(200);
 const laptop=ready('laptop');expect(()=>cmd(laptop,{...assembly('laptop'),cooling:150})).toThrow(/20～120W/);
});
it('laptop packaging has a cost and cooling tradeoff',()=>{
 const pc=cmd(ready(),assembly()).products[0];const laptop=cmd(ready('laptop'),assembly('laptop')).products[0];
 expect(laptop.unitCost).toBeGreaterThan(pc.unitCost);expect(laptop.performance).toBeLessThan(pc.performance);
});
it('monitor choices affect performance cost and appearance',()=>{
 const s=ready('monitor');const d=(resolution:number,refresh:number)=>cmd(s,{type:'design',kind:'monitor',name:'Vista',spec:{resolution,refresh,gamut:90,appearance:'silver'},price:800}).products[0];
 const basic=d(1080,60),premium=d(1440,75);
 expect(()=>d(2160,144)).toThrow(/現在の研究では/);expect(premium.unitCost).toBeGreaterThan(basic.unitCost);expect(premium.performance).toBeGreaterThan(basic.performance);
 expect(()=>d(0,60)).toThrow();
});
it('assembly consumes own component stock and pays only unowned inputs',()=>{
 let s=ready();s.research.completed.push('cpu-compute-1');s=cmd(s,{type:'design',kind:'cpu',name:'Own CPU',spec:{cores:4,clock:3,ipc:1,process:14,cooling:40,socket:'Atlas'},price:400});s=cmd(s,{type:'advance',days:14});
 s=cmd(s,assembly('pc','gaming',{...parts,cpu:'p-1'}));s=cmd(s,{type:'advance',days:14});s=cmd(s,{type:'launch',id:'p-2'});s=cmd(s,{type:'line',id:'p-2',target:100});
 expect(cmd(s,{type:'advance',days:1}).products[1].inventory).toBe(0);
 s=cmd(s,{type:'launch',id:'p-1'});s.products[0].inventory=5;const n=cmd(s,{type:'advance',days:1});expect(n.products[0].inventory).toBe(0);expect(n.products[1].inventory).toBe(5);
 expect(s.company.cash-n.company.cash).toBe(5*(s.products[1].unitCost-s.products[0].unitCost));
});
