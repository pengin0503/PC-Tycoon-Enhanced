import {it,expect} from 'vitest';
import {createGame,command,type GameState} from '../packages/sim/src/index';
import {exportSave,importSave} from '../packages/save/src/index';
import {unlockBranch} from './research-helpers';
const cmd=(s:any,c:any)=>command(s,c) as GameState;
const start=()=>createGame({id:'g2',name:'部品社',year:2026,difficulty:'normal',seed:7});
const unlock=(s:GameState,...ids:string[])=>{s.research.completed.push(...ids);return s;};
const legacyCpu={cores:4,clock:3,ipc:1,process:14,cooling:40,socket:'Atlas'};
const parts={cpu:'v-cpu',gpu:'v-gpu',motherboard:'v-board',ram:'v-ram',storage:'v-storage'};
const psuSpec=(wattage:number,efficiency=85,modular='none')=>({wattage,efficiency,modular});
const assembly=(selected:Record<string,string>)=>({type:'assemble',kind:'pc',name:'Rig',parts:selected,purpose:'gaming',appearance:'graphite',price:3000});

it('CPU cache is a design field; specs saved before it existed keep their metrics',()=>{
 const s=unlock(start(),'cpu-compute-1');
 const legacy=cmd(s,{type:'design',kind:'cpu',name:'L',spec:legacyCpu,price:400}).products[0];
 expect(legacy.performance).toBe(1200);expect(legacy.unitCost).toBe(190);expect(legacy.spec.cache).toBe(8);
 const big=cmd(s,{type:'design',kind:'cpu',name:'B',spec:{...legacyCpu,cache:16},price:600}).products[0];
 expect(big.performance).toBeGreaterThan(legacy.performance);expect(big.unitCost).toBeGreaterThan(legacy.unitCost);
 expect(()=>cmd(s,{type:'design',kind:'cpu',name:'X',spec:{...legacyCpu,cache:3},price:400})).toThrow();
 expect(()=>cmd(s,{type:'design',kind:'cpu',name:'X',spec:{...legacyCpu,cache:8,bogus:1},price:400})).toThrow();
});

it('old JSON with cache-less CPU products still loads',()=>{
 const s=cmd(unlock(start(),'cpu-compute-1'),{type:'design',kind:'cpu',name:'L',spec:legacyCpu,price:400});
 const json=JSON.parse(exportSave(s));delete json.products[0].spec.cache;
 expect(importSave(JSON.stringify(json)).products[0].spec.cache).toBeUndefined();
});

it('old JSON with cooler-less parts and devices, or specs beyond today\'s research ranges, still loads',()=>{
 let s=cmd(unlock(start(),'cpu-compute-1','pc-compute-1'),{type:'design',kind:'cpu',name:'L',spec:legacyCpu,price:400});
 s=cmd(s,assembly(parts));
 const json=JSON.parse(exportSave(s));
 delete json.products[0].spec.cooling;delete json.products[1].spec.cooling;json.products[0].spec.cores=8;json.products[0].spec.clock=5;
 const loaded=importSave(JSON.stringify(json));
 expect(loaded.products[0].spec.cooling).toBeUndefined();expect(loaded.products[1].spec.cooling).toBeUndefined();expect(loaded.products[0].performance).toBe(1200);
});

it('PSU is a researched component with wattage, efficiency and cable tradeoffs',()=>{
 expect(()=>cmd(start(),{type:'design',kind:'psu',name:'P',spec:psuSpec(550),price:200})).toThrow();
 const s=unlock(start(),'psu-compute-1');
 const d=(spec:ReturnType<typeof psuSpec>)=>cmd(s,{type:'design',kind:'psu',name:'P',spec,price:250}).products[0];
 const base=d(psuSpec(550)),gold=d(psuSpec(550,88)),full=d(psuSpec(550,85,'full')),large=d(psuSpec(750));
 expect(()=>d(psuSpec(1200))).toThrow(/定格出力は現在の研究では300～750W/);
 expect(gold.unitCost).toBeGreaterThan(base.unitCost);expect(gold.power).toBeLessThan(base.power);
 expect(full.performance).toBeGreaterThan(base.performance);expect(large.performance).toBeGreaterThan(base.performance);
 expect(()=>d(psuSpec(250))).toThrow();expect(()=>d({...psuSpec(550),modular:'magic'})).toThrow();
});

it('assembled PCs accept an optional PSU that must cover the parts with headroom',()=>{
 let s=unlock(start(),'pc-compute-1','psu-compute-1');
 const none=cmd(s,assembly(parts)).products[0];
 const vendor=cmd(s,assembly({...parts,psu:'v-psu'})).products[0];
 expect(vendor.unitCost).toBe(none.unitCost+90);expect(vendor.reliability).toBeGreaterThan(none.reliability);
 expect(vendor.spec.psu).toBe('v-psu');expect(none.spec.psu).toBeUndefined();
 s=cmd(s,{type:'design',kind:'psu',name:'Tiny',spec:psuSpec(300,80),price:120});s=cmd(s,{type:'advance',days:14});
 // vendor parts draw 90; 300W easily covers them
 expect(()=>cmd(s,assembly({...parts,psu:'p-1'}))).not.toThrow();
 expect(()=>cmd(s,assembly({...parts,psu:'v-cpu'}))).toThrow();
 s=unlock(s,'gpu-compute-1');unlockBranch(s,'gpu','capacity',8);unlockBranch(s,'gpu','power',1);
 s=cmd(s,{type:'design',kind:'gpu',name:'Hot',spec:{units:55,clock:1.2,vram:8,bandwidth:256,cooling:250},price:4000});s=cmd(s,{type:'advance',days:14});
 const hot={...parts,gpu:'p-2'};
 expect(()=>cmd(s,assembly({...hot,psu:'p-1'}))).toThrow(/電源の定格出力が不足/);
});

it('manufacturing a PC consumes own PSU stock',()=>{
 let s=unlock(start(),'pc-compute-1','psu-compute-1');
 s=cmd(s,{type:'design',kind:'psu',name:'P',spec:psuSpec(650),price:250});s=cmd(s,{type:'advance',days:14});
 s=cmd(s,assembly({...parts,psu:'p-1'}));s=cmd(s,{type:'advance',days:14});
 s=cmd(s,{type:'launch',id:'p-1'});s=cmd(s,{type:'launch',id:'p-2'});
 s=cmd(s,{type:'line',id:'p-1',target:10});s=cmd(s,{type:'advance',days:1});expect(s.products[0].inventory).toBe(10);
 s=cmd(s,{type:'line',id:'p-1',target:0});s=cmd(s,{type:'line',id:'p-2',target:3});s=cmd(s,{type:'advance',days:1});
 expect(s.products[1].inventory).toBe(3);expect(s.products[0].inventory).toBe(7);
});

it('factory expands to level 13 and no further',()=>{
 let s=start();s.company.cash=100_000_000;
 for(let level=2;level<=13;level++)s=cmd(s,{type:'factory',level});
 expect(s.factoryLevel).toBe(13);expect(()=>cmd(s,{type:'factory',level:14})).toThrow();
});
