import {it,expect} from 'vitest';
import {techCatalog,techEffect} from '../packages/content/src/research';
import {evaluateHardware} from '../packages/sim/src/hardware';
import {defaultSpec,fieldRange,hardwareCatalog} from '../packages/content/src/hardware';
import {hardwareKinds} from '../packages/content/src/research';
import {unlockBranch} from './research-helpers';
import {unlockedRange} from '../packages/content/src/unlocks';
import {osSliders} from '../packages/content/src/os';
import {aiDesignSliders} from '../packages/content/src/ai';
import {createGame,command} from '../packages/sim/src/index';
import {evaluateDevice} from '../packages/sim/src/devices';
import {estimateLLM,estimateInference} from '../packages/sim/src/ai-math';
import * as events from '../packages/sim/src/events';
const cmd=(s:any,c:any)=>command(s,c);
it('catalog contains 3000 unique reachable effect-bearing nodes',()=>{
 expect(techCatalog).toHaveLength(3345);expect(new Set(techCatalog.map(t=>t.id)).size).toBe(3345);
 const map=new Map(techCatalog.map(t=>[t.id,t]));const visiting=new Set<string>(),seen=new Set<string>();
 const visit=(id:string)=>{expect(visiting.has(id)).toBe(false);if(seen.has(id))return;const t=map.get(id)!;expect(t).toBeDefined();expect(t.effect).toBeGreaterThan(0);visiting.add(id);t.prerequisites.forEach(visit);visiting.delete(id);seen.add(id);};techCatalog.forEach(t=>visit(t.id));expect(seen.size).toBe(3345);
 expect(new Set(techCatalog.map(t=>t.category)).size).toBe(11);for(const cat of new Set(techCatalog.map(t=>t.category)))expect(new Set(techCatalog.filter(t=>t.category===cat&&t.axis!=='visual').map(t=>t.axis)).size).toBe(6);
});
it('hardware research widens slider ranges instead of multiplying performance; power cost and reliability stay direct',()=>{
 const base=['cpu-compute-1'];const a=evaluateHardware('cpu',defaultSpec('cpu'),base);
 for(const id of ['cpu-compute-2','cpu-compatibility-1','cpu-capacity-1'])expect(evaluateHardware('cpu',defaultSpec('cpu'),[...base,id]).performance).toBe(a.performance);
 expect(fieldRange('cpu','clock',base).max).toBe(3.2);expect(fieldRange('cpu','clock',[...base,'cpu-compute-2']).max).toBe(3.4);
 expect(fieldRange('cpu','ipc',[...base,'cpu-compute-2']).max).toBeGreaterThan(fieldRange('cpu','ipc',base).max);
 expect(fieldRange('cpu','cache',[...base,'cpu-compatibility-1']).max).toBeGreaterThan(fieldRange('cpu','cache',base).max);
 expect(fieldRange('cpu','process',base)).toEqual({min:14,max:28});expect(fieldRange('cpu','process',[...base,'cpu-power-1']).min).toBeLessThan(14);
 expect(evaluateHardware('cpu',defaultSpec('cpu'),[...base,'cpu-power-1']).power).toBeLessThan(a.power);
 expect(evaluateHardware('cpu',defaultSpec('cpu'),[...base,'cpu-cost-1']).unitCost).toBeLessThan(a.unitCost);
 expect((evaluateHardware('cpu',defaultSpec('cpu'),[...base,'cpu-reliability-1']) as any).reliability).toBeGreaterThan((a as any).reliability);
 expect(()=>evaluateHardware('cpu',{...defaultSpec('cpu'),cores:6},base)).toThrow(/コア数/);
 expect(evaluateHardware('cpu',{...defaultSpec('cpu'),cores:6},[...base,'cpu-capacity-1']).performance).toBeGreaterThan(a.performance);
});
it('slider ranges start narrow, grow monotonically with research and reach the absolute bound at the last stage',()=>{
 for(const kind of hardwareKinds)for(const [key,field] of Object.entries(hardwareCatalog[kind].fields)){
  if(field.options)continue;
  const start=fieldRange(kind,key,[`${kind}-compute-1`]);
  if(field.lowerIsBetter)expect(start.min).toBeGreaterThan(Number(field.min));else expect(start.max).toBeLessThan(Number(field.max));
  expect(Number(field.default)).toBeGreaterThanOrEqual(start.min);expect(Number(field.default)).toBeLessThanOrEqual(start.max);
  let previous=start;
  for(const level of [5,10,25,50]){
   const s={research:{completed:[] as string[]}};for(const axis of field.unlock!.axes)unlockBranch(s,kind,axis,level);
   const r=fieldRange(kind,key,s.research.completed);
   if(field.lowerIsBetter)expect(r.min).toBeLessThanOrEqual(previous.min);else expect(r.max).toBeGreaterThanOrEqual(previous.max);
   previous=r;
  }
  expect(field.lowerIsBetter?previous.min:previous.max).toBe(Number(field.lowerIsBetter?field.min:field.max));
 }
});
it('list-valued AI sliders only ever unlock up to a value the player can select',()=>{
 for(const slider of Object.values(aiDesignSliders)){
  if(!('values' in slider))continue;
  let previous:number=slider.unlock.from;
  for(let level=0;level<=50;level++){
   const s={research:{completed:['ai-compute-1']}};if(level)for(const axis of slider.unlock.axes)unlockBranch(s,'ai',axis,level);
   const {max}=unlockedRange(slider,'ai',s.research.completed);
   expect(slider.values).toContain(max);expect(max).toBeGreaterThanOrEqual(previous);previous=max;
  }
  expect(previous).toBe(slider.max);
 }
 // The first context stage opens 16K/32K/64K, not an unselectable raw bound in between.
 expect(unlockedRange(aiDesignSliders.context,'ai',['ai-compute-1','ai-context-1']).max).toBe(65536);
});
it('device research lowers cost and widens case cooling instead of multiplying performance',()=>{
 const s=createGame({id:'content',name:'技術社',year:2026,difficulty:'normal',seed:42});s.research.completed=['pc-compute-1'];
 const parts={cpu:'v-cpu',gpu:'v-gpu',motherboard:'v-board',ram:'v-ram',storage:'v-storage'};
 const a=evaluateDevice(s,parts,'gaming','pc',undefined,false,150);
 expect(()=>evaluateDevice(s,parts,'gaming','pc',undefined,false,300)).toThrow(/冷却性能は現在の研究では50～250W/);
 s.research.completed.push('pc-cost-1','pc-compute-2');const b=evaluateDevice(s,parts,'gaming','pc',undefined,false,150);
 expect(b.unitCost).toBeLessThan(a.unitCost);expect(b.performance).toBe(a.performance);
 expect(evaluateDevice(s,parts,'gaming','pc',undefined,false,260).power).toBe(a.power);
 expect(()=>evaluateDevice(s,parts,'gaming','pc',undefined,false,80)).toThrow(/冷却性能が不足しています（消費電力 90W \/ 冷却性能 80W）/);
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
 const s=createGame({id:'events',name:'市況社',year:2026,difficulty:'normal',seed:1});expect((events as any).marketMonthly).toBeTypeOf('function');(events as any).marketMonthly(s);expect((s as any).pendingDecision!==null||(s as any).modifiers.demand!==1||(s as any).modifiers.production!==1).toBe(true);
 const after=cmd(s,{type:'advance',days:31});expect(after.modifiers.expiresDay===0||after.modifiers.expiresDay>after.day).toBe(true);
});
it('all OS research branches lower costs, raise reliability or widen the design sliders',()=>{
 const base=createGame({id:'os-tech',name:'OS技術',year:2026,difficulty:'normal',seed:42});base.research.completed=['os-compute-1'];
 const design={type:'developOS',name:'OS',version:1,features:['files'],quality:.8,compatibility:.8,support:.7,price:50};
 const a=cmd(base,design);
 const withTech=(id:string)=>({...base,research:{completed:[...base.research.completed,id],active:[]}});
 expect(cmd(withTech('os-cost-1'),design).company.cash).toBeGreaterThan(a.company.cash);
 expect(cmd(withTech('os-power-1'),design).products[0].unitCost).toBeLessThanOrEqual(a.products[0].unitCost);
 expect(cmd(withTech('os-reliability-1'),design).products[0].reliability).toBeGreaterThan(a.products[0].reliability);
 for(const [id,key] of [['os-compute-2','quality'],['os-compatibility-1','compatibility'],['os-capacity-1','support']] as const){
  const before=unlockedRange(osSliders[key],'os',base.research.completed).max,after=unlockedRange(osSliders[key],'os',withTech(id).research.completed).max;
  expect(after).toBeGreaterThan(before);
  expect(()=>cmd(base,{...design,[key]:after})).toThrow(/現在の研究では/);
  const b=cmd(withTech(id),{...design,[key]:after});
  expect(Number(b.products[0].spec[key])).toBe(after);expect(b.products[0].performance).toBeGreaterThan(a.products[0].performance);
 }
 expect(cmd(withTech('os-compute-2'),design).products[0].performance).toBe(a.products[0].performance);
});
