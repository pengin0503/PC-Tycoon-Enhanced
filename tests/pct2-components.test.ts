import {withTestStaff} from './staff-fixture';
const createGame=(...args:Parameters<typeof baseGame>)=>withTestStaff(baseGame(...args));
import {it,expect} from 'vitest';
import {createGame as baseGame,command,type GameState} from '../packages/sim/src/index';
import {exportSave,importSave} from '../packages/save/src/index';
import {researchTo,frontierSpec} from './research-helpers';
import {evaluateHardware} from '../packages/sim/src/hardware';
const cmd=(s:any,c:any)=>command(s,c) as GameState;
const start=()=>createGame({id:'g2',name:'部品社',difficulty:'normal',seed:7});
const unlock=(s:GameState,...ids:string[])=>{s.research.completed.push(...ids);return s;};
/** Year-2000 default CPU; `legacyCpu` is the same design saved before the cache field existed. */
const cpu2000={cores:1,clock:.8,ipc:1,process:180,cache:.25,cooling:40,socket:'Atlas'};
const {cache:_cache,...legacyCpu}=cpu2000;
const parts={cpu:'v-cpu',gpu:'v-gpu',motherboard:'v-board',ram:'v-ram',storage:'v-storage'};
const psuSpec=(wattage:number,efficiency=70,modular='none')=>({wattage,efficiency,modular});
const assembly=(selected:Record<string,string>)=>({type:'assemble',kind:'pc',name:'Rig',parts:selected,purpose:'gaming',appearance:'graphite',price:300000});

it('CPU cache is a design field; specs saved before it existed keep their metrics',()=>{
 const s=unlock(start(),'cpu-compute-1');
 const base=cmd(s,{type:'design',kind:'cpu',name:'L',spec:cpu2000,price:40000}).products[0];
 expect(base.performance).toBe(1200);expect(base.unitCost).toBe(19000);expect(base.spec.cache).toBe(.25);
 const big=cmd(s,{type:'design',kind:'cpu',name:'B',spec:{...cpu2000,cache:.5},price:60000}).products[0];
 expect(big.performance).toBeGreaterThan(base.performance);expect(big.unitCost).toBeGreaterThan(base.unitCost);
 expect(()=>cmd(s,{type:'design',kind:'cpu',name:'X',spec:{...cpu2000,cache:.3},price:40000})).toThrow();
 expect(()=>cmd(s,{type:'design',kind:'cpu',name:'X',spec:{...cpu2000,bogus:1},price:40000})).toThrow();
 // New designs must choose a cache: the value assumed for old saves (8MB) is beyond year-2000 research.
 expect(()=>cmd(s,{type:'design',kind:'cpu',name:'X',spec:legacyCpu,price:40000})).toThrow(/キャッシュ容量.*現在の研究では/);
 expect(evaluateHardware('cpu',legacyCpu,s.research.completed,{stored:true}).performance).toBeGreaterThan(0);
});

it('old JSON with cache-less CPU products still loads',()=>{
 const s=cmd(unlock(start(),'cpu-compute-1'),{type:'design',kind:'cpu',name:'L',spec:cpu2000,price:40000});
 const json=JSON.parse(exportSave(s));delete json.products[0].spec.cache;
 expect(importSave(JSON.stringify(json)).products[0].spec.cache).toBeUndefined();
});

it('old JSON with cooler-less parts and devices, or specs beyond today\'s research ranges, still loads',()=>{
 let s=cmd(unlock(start(),'cpu-compute-1','pc-compute-1'),{type:'design',kind:'cpu',name:'L',spec:cpu2000,price:40000});
 s=cmd(s,assembly(parts));
 const json=JSON.parse(exportSave(s));
 delete json.products[0].spec.cooling;delete json.products[1].spec.cooling;json.products[0].spec.cores=8;json.products[0].spec.clock=5;
 const loaded=importSave(JSON.stringify(json));
 expect(loaded.products[0].spec.cooling).toBeUndefined();expect(loaded.products[1].spec.cooling).toBeUndefined();expect(loaded.products[0].performance).toBe(1200);
});

it('PSU is a researched component with wattage, efficiency and cable tradeoffs',()=>{
 expect(()=>cmd(start(),{type:'design',kind:'psu',name:'P',spec:psuSpec(300),price:20000})).toThrow();
 const s=unlock(start(),'psu-compute-1');
 const d=(spec:ReturnType<typeof psuSpec>,state=s)=>cmd(state,{type:'design',kind:'psu',name:'P',spec,price:8000}).products.at(-1)!;
 const base=d(psuSpec(300)),efficient=d(psuSpec(300,75)),large=d(psuSpec(400));
 expect(()=>d(psuSpec(450))).toThrow(/定格出力は現在の研究では150～400W/);
 expect(efficient.unitCost).toBeGreaterThan(base.unitCost);expect(efficient.power).toBeLessThan(base.power);
 expect(large.performance).toBeGreaterThan(base.performance);
 // Modular cables are 2004 (semi) and 2008 (full) technology.
 expect(()=>d(psuSpec(300,70,'semi'))).toThrow(/研究が必要/);
 const later=researchTo(structuredClone(s),'psu',.08);later.day=8*360;later.year=2008;
 const full=d(psuSpec(300,70,'full'),later),plain=d(psuSpec(300),later);
 expect(full.performance).toBeGreaterThan(plain.performance);expect(full.unitCost).toBeGreaterThan(plain.unitCost);
 expect(()=>d(psuSpec(125))).toThrow();expect(()=>d({...psuSpec(300),modular:'magic'})).toThrow();
});

it('assembled PCs accept an optional PSU that must cover the parts with headroom',()=>{
 let s=unlock(start(),'pc-compute-1','psu-compute-1');
 const none=cmd(s,assembly(parts)).products[0];
 const vendor=cmd(s,assembly({...parts,psu:'v-psu'})).products[0];
 expect(vendor.unitCost).toBe(none.unitCost+9900);expect(vendor.reliability).toBeGreaterThan(none.reliability);
 expect(vendor.spec.psu).toBe('v-psu');expect(none.spec.psu).toBeUndefined();
 // The PSU's conversion loss is heat inside the case: it adds to the power the case cooling must cover.
 expect(vendor.power).toBe(none.power+13);
 expect(()=>cmd(s,{...assembly(parts),cooling:70})).not.toThrow();
 expect(()=>cmd(s,{...assembly({...parts,psu:'v-psu'}),cooling:70})).toThrow(/消費電力 75W \/ 冷却性能 70W/);
 s=cmd(s,{type:'design',kind:'psu',name:'Tiny',spec:psuSpec(300),price:12000});s=cmd(s,{type:'advance',days:14});
 // vendor parts draw 62W; 300W easily covers them
 expect(()=>cmd(s,assembly({...parts,psu:'p-1'}))).not.toThrow();
 expect(()=>cmd(s,assembly({...parts,psu:'v-cpu'}))).toThrow();
 // A year-2025 frontier GPU draws far more than a 300W supply can deliver.
 s=researchTo(unlock(s,'gpu-compute-1'),'gpu',.25);s.day=25*360;s.year=2025;const hotSpec=frontierSpec('gpu',s.research.completed);
  while(evaluateHardware('gpu',hotSpec,s.research.completed,{stored:true}).power>Number(hotSpec.cooling)&&Number(hotSpec.units)>1)hotSpec.units=Number(hotSpec.units)/2;
 s.company.cash=10_000_000_000;
 s=cmd(s,{type:'design',kind:'gpu',name:'Hot',spec:hotSpec,price:evaluateHardware('gpu',hotSpec,s.research.completed).unitCost*2});s=cmd(s,{type:'advance',days:14});
 const hot={...parts,gpu:'p-2'};
 expect(()=>cmd(s,assembly({...hot,psu:'p-1'}))).toThrow(/電源の定格出力が不足/);
});

it('manufacturing a PC consumes own PSU stock',()=>{
 let s=unlock(start(),'pc-compute-1','psu-compute-1');
 s=cmd(s,{type:'design',kind:'psu',name:'P',spec:psuSpec(400),price:25000});s=cmd(s,{type:'advance',days:14});
 s=cmd(s,assembly({...parts,psu:'p-1'}));s=cmd(s,{type:'advance',days:14});
 s=cmd(s,{type:'launch',id:'p-1'});s=cmd(s,{type:'launch',id:'p-2'});
 s=cmd(s,{type:'line',id:'p-1',target:10});s=cmd(s,{type:'advance',days:1});expect(s.products[0].inventory).toBe(10);
 s=cmd(s,{type:'line',id:'p-1',target:0});s=cmd(s,{type:'line',id:'p-2',target:3});s=cmd(s,{type:'advance',days:1});
 expect(s.products[1].inventory).toBe(3);expect(s.products[0].inventory+s.products[0].sold).toBe(7);
});

it('factory expands to level 13 and no further',()=>{
 let s=start();s.company.cash=100_000_000_000;
 for(let level=2;level<=13;level++)s=cmd(s,{type:'factory',level});
 expect(s.factoryLevel).toBe(13);expect(()=>cmd(s,{type:'factory',level:14})).toThrow();
});
