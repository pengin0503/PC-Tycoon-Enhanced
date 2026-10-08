import {it,expect} from 'vitest';
import {techCatalog,techEffect} from '../packages/content/src/research';
import {evaluateHardware} from '../packages/sim/src/hardware';
import {defaultSpec} from '../packages/content/src/hardware';
import {createGame,command} from '../packages/sim/src/index';
import {evaluateDevice} from '../packages/sim/src/devices';
import {estimateLLM,estimateInference} from '../packages/sim/src/ai-math';
import * as events from '../packages/sim/src/events';
const cmd=(s:any,c:any)=>command(s,c);
it('catalog contains 3000 unique reachable effect-bearing nodes',()=>{
 expect(techCatalog).toHaveLength(3040);expect(new Set(techCatalog.map(t=>t.id)).size).toBe(3040);
 const map=new Map(techCatalog.map(t=>[t.id,t]));const visiting=new Set<string>(),seen=new Set<string>();
 const visit=(id:string)=>{expect(visiting.has(id)).toBe(false);if(seen.has(id))return;const t=map.get(id)!;expect(t).toBeDefined();expect(t.effect).toBeGreaterThan(0);visiting.add(id);t.prerequisites.forEach(visit);visiting.delete(id);seen.add(id);};techCatalog.forEach(t=>visit(t.id));expect(seen.size).toBe(3040);
 expect(new Set(techCatalog.map(t=>t.category)).size).toBe(10);for(const cat of new Set(techCatalog.map(t=>t.category)))expect(new Set(techCatalog.filter(t=>t.category===cat&&t.axis!=='visual').map(t=>t.axis)).size).toBe(6);
});
it('hardware research changes compute power cost reliability and capacity',()=>{
 const base=['cpu-compute-1'];const a=evaluateHardware('cpu',defaultSpec('cpu'),base);
 expect(evaluateHardware('cpu',defaultSpec('cpu'),[...base,'cpu-compute-2']).performance).toBeGreaterThan(a.performance);
 expect(evaluateHardware('cpu',defaultSpec('cpu'),[...base,'cpu-power-1']).power).toBeLessThan(a.power);
 expect(evaluateHardware('cpu',defaultSpec('cpu'),[...base,'cpu-cost-1']).unitCost).toBeLessThan(a.unitCost);
 expect((evaluateHardware('cpu',defaultSpec('cpu'),[...base,'cpu-reliability-1']) as any).reliability).toBeGreaterThan((a as any).reliability);
 expect(evaluateHardware('cpu',defaultSpec('cpu'),[...base,'cpu-compatibility-1']).performance).toBeGreaterThan(a.performance);
 expect(()=>evaluateHardware('cpu',{...defaultSpec('cpu'),cores:9},base)).toThrow();expect(evaluateHardware('cpu',{...defaultSpec('cpu'),cores:9},[...base,'cpu-capacity-1']).performance).toBeGreaterThan(a.performance);
});
it('device research alters real purpose scores and packaging cost',()=>{
 const s=createGame({id:'content',name:'技術社',year:2026,difficulty:'normal',seed:42});s.research.completed=['pc-compute-1'];
 const parts={cpu:'v-cpu',gpu:'v-gpu',motherboard:'v-board',ram:'v-ram',storage:'v-storage'};
 const a=evaluateDevice(s,parts,'gaming','pc');s.research.completed.push('pc-cost-1','pc-compute-2');const b=evaluateDevice(s,parts,'gaming','pc');expect(b.unitCost).toBeLessThan(a.unitCost);expect(b.performance).toBeGreaterThan(a.performance);
});
it('AI data/context/economics/architecture/quantization research has distinct consequences',()=>{
 const d:any={architecture:'dense',total:1e9,active:1e9,layers:24,hidden:2048,attention:'standard',context:4096,tokens:1e9,quality:.8,diversity:.8};
 const c:any={id:'c',gpuId:'v',serverId:'vendor',gpus:1,peakFlops:2e14,vramBytes:48e9,powerWatts:350,network:.8,cooling:.9,purchaseCost:20000};
 const train=estimateLLM as any;const inf=estimateInference as any;const base=train(d,c);
 expect(train(d,c,{data:techEffect(['ai-data-1'],'ai','data')}).cost).toBeLessThan(base.cost);
 expect(train(d,c,{economics:.2}).cost).toBeLessThan(base.cost);expect(train(d,c,{context:.2}).seconds).toBeLessThan(base.seconds);expect(train(d,c,{architecture:.2}).seconds).toBeLessThan(base.seconds);
 const a=inf(d,c,4,4096,1),b=inf(d,c,4,4096,1,{quantization:.2});expect(b.qualityPenalty).toBeLessThan(a.qualityPenalty);expect(b.tokensPerSecond).toBeGreaterThan(a.tokensPerSecond);
});
it('long economy replay and save boundaries stay finite',()=>{
 const s=createGame({id:'long',name:'長期社',year:2026,difficulty:'normal',seed:42});const a=cmd(s,{type:'advance',days:365}),b=cmd(cmd(s,{type:'advance',days:180}),{type:'advance',days:185});expect(a).toEqual(b);expect(a.history).toHaveLength(12);expect(a.company.cash).toBeGreaterThanOrEqual(0);
});
it('seeded market events change real modifiers and expire',()=>{
 const s=createGame({id:'events',name:'市況社',year:2026,difficulty:'normal',seed:1});expect((events as any).marketMonthly).toBeTypeOf('function');(events as any).marketMonthly(s);expect((s as any).modifiers.demand).not.toBe(1);
 const after=cmd(s,{type:'advance',days:31});expect(after.modifiers.expiresDay===0||after.modifiers.expiresDay>after.day).toBe(true);
});
it('all OS research branches affect responsiveness costs or compatibility',()=>{
 const base=createGame({id:'os-tech',name:'OS技術',year:2026,difficulty:'normal',seed:42});base.research.completed=['os-compute-1'];
 const design={type:'developOS',name:'OS',version:1,features:['files'],quality:.8,compatibility:.8,support:.8,price:50};
 const a=cmd(base,design);for(const axis of ['compute','power','cost','reliability','capacity','compatibility']){
  const id=`os-${axis}-${axis==='compute'?2:1}`;const b=cmd({...base,research:{completed:[...base.research.completed,id],active:[]}},design);
  if(axis==='cost')expect(b.company.cash).toBeGreaterThan(a.company.cash);
  else if(axis==='reliability')expect(b.products[0].reliability).toBeGreaterThan(a.products[0].reliability);
  else if(axis==='compatibility')expect(Number(b.products[0].spec.compatibility)).toBeGreaterThan(Number(a.products[0].spec.compatibility));
  else expect(b.products[0].performance).toBeGreaterThan(a.products[0].performance);
 }
});
