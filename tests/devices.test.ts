import {it,expect} from 'vitest';
import {createGame,command} from '../packages/sim/src/index';
const cmd=(s:any,c:any)=>command(s,c);const parts={cpu:'v-cpu',gpu:'v-gpu',motherboard:'v-board',ram:'v-ram',storage:'v-storage'};
function ready(kind='pc'){let s=createGame({id:'dev',name:'端末社',year:2026,difficulty:'normal',seed:42});return cmd(cmd(s,{type:'research',id:`${kind}-compute-1`}),{type:'advance',days:7});}
const assembly=(kind='pc',purpose='gaming',selected=parts)=>({type:'assemble',kind,name:'Polar Station',parts:selected,purpose,appearance:'graphite',price:3000});
it('assembles purpose-specific compatible devices',()=>{
 let s=ready();s.research.completed.push('cpu-compute-1');
 s=cmd(s,{type:'design',kind:'cpu',name:'Compute',spec:{cores:8,clock:3,ipc:2,process:14,socket:'Atlas'},price:800});s=cmd(s,{type:'advance',days:14});
 const selected={...parts,cpu:'p-1'};
 const gaming=cmd(s,assembly('pc','gaming',selected)).products[1];const office=cmd(s,assembly('pc','office',selected)).products[1];
 expect(gaming.unitCost).toBeGreaterThan(1000);expect(gaming.performance).not.toBe(office.performance);expect(gaming.spec.appearance).toBe('graphite');
 const server=cmd(s,assembly('pc','server',selected)).products[1];expect(server.performance).not.toBe(gaming.performance);
});
it('rejects incompatible or wrong-category parts',()=>{
 const s=ready();for(const change of [{cpu:'v-cpu-nova'},{ram:'v-ram-ddr5'},{cpu:'v-gpu'},{storage:'missing'}])expect(()=>cmd(s,assembly('pc','gaming',{...parts,...change}))).toThrow();
});
it('laptop packaging has a cost and cooling tradeoff',()=>{
 const pc=cmd(ready(),assembly()).products[0];const laptop=cmd(ready('laptop'),assembly('laptop')).products[0];
 expect(laptop.unitCost).toBeGreaterThan(pc.unitCost);expect(laptop.performance).toBeLessThan(pc.performance);
});
it('monitor choices affect performance cost and appearance',()=>{
 const s=ready('monitor');const d=(resolution:number,refresh:number)=>cmd(s,{type:'design',kind:'monitor',name:'Vista',spec:{resolution,refresh,gamut:90,appearance:'silver'},price:800}).products[0];
 const basic=d(1080,60),premium=d(2160,144);expect(premium.unitCost).toBeGreaterThan(basic.unitCost);expect(premium.performance).toBeGreaterThan(basic.performance);
 expect(()=>d(0,60)).toThrow();
});
