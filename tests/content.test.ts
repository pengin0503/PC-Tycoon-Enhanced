import {withTestStaff} from './staff-fixture';
import {it,expect} from 'vitest';
import {techCatalog,techEffect,techById,researchBranches} from '../packages/content/src/tech-catalog';
import {evaluateHardware} from '../packages/sim/src/hardware';
import {defaultSpec,fieldRange,designFields} from '../packages/content/src/hardware';
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
it('catalog is unique, acyclic and reachable, and every branch improves exactly one specification',()=>{
 const ids=new Set(techCatalog.map(t=>t.id));expect(ids.size).toBe(techCatalog.length);expect(techCatalog.length).toBeGreaterThan(2500);
 const map=new Map(techCatalog.map(t=>[t.id,t]));const visiting=new Set<string>(),seen=new Set<string>();
 const visit=(id:string)=>{expect(visiting.has(id)).toBe(false);if(seen.has(id))return;const t=map.get(id)!;expect(t,id).toBeDefined();visiting.add(id);t.prerequisites.forEach(visit);visiting.delete(id);seen.add(id);};techCatalog.forEach(t=>visit(t.id));expect(seen.size).toBe(techCatalog.length);
 expect(new Set(techCatalog.map(t=>t.category)).size).toBe(11);
 for(const kind of hardwareKinds){
  const branches=new Set(researchBranches(kind).filter(b=>b.kind==='slider'||b.kind==='option').map(b=>b.axis));
  const researched=designFields(kind).filter(([,f])=>f.unlock||f.optionUnlock);
  expect([...branches].sort()).toEqual(researched.map(([k])=>k).sort());
  // A field is widened by its own branch only, and a branch widens only its own field.
  for(const [key,f] of researched)expect((f.unlock??f.optionUnlock)!.axes,`${kind}.${key}`).toEqual([key]);
 }
 const osAxes=Object.values(osSliders).map(f=>f.unlock.axes);for(const a of osAxes)expect(a).toHaveLength(1);
 expect(new Set(osAxes.flat()).size).toBe(osAxes.length);
 for(const slider of Object.values(aiDesignSliders))if('unlock' in slider)expect(slider.unlock.axes).toHaveLength(1);
 // Stage 1 of each branch needs only the category foundation; later stages need the previous stage.
 expect(techById.get('cpu-cores-1')!.prerequisites).toEqual(['cpu-compute-1']);
 expect(techById.get('cpu-cores-2')!.prerequisites).toEqual(['cpu-cores-1','cpu-compute-1']);
});
it('hardware research widens one slider range per branch instead of multiplying performance; power and cost stay direct',()=>{
 const base=['cpu-compute-1'];const a=evaluateHardware('cpu',defaultSpec('cpu'),base);
 for(const id of ['cpu-clock-1','cpu-ipc-1','cpu-cores-1','cpu-l2Cache-1'])expect(evaluateHardware('cpu',defaultSpec('cpu'),[...base,id]).performance).toBe(a.performance);
 expect(fieldRange('cpu','clock',base).max).toBe(1);expect(fieldRange('cpu','clock',[...base,'cpu-clock-1']).max).toBe(1.8);
 // Clock research does not touch IPC, cores or caches.
 for(const key of ['ipc','cores','l1Cache','l2Cache','l3Cache'])expect(fieldRange('cpu',key,[...base,'cpu-clock-1'])).toEqual(fieldRange('cpu',key,base));
 expect(fieldRange('cpu','ipc',[...base,'cpu-ipc-1']).max).toBeGreaterThan(fieldRange('cpu','ipc',base).max);
 expect(fieldRange('cpu','l2Cache',[...base,'cpu-l2Cache-1']).max).toBeGreaterThan(fieldRange('cpu','l2Cache',base).max);
 expect(fieldRange('cpu','l3Cache',[...base,'cpu-l2Cache-1'])).toEqual(fieldRange('cpu','l3Cache',base));
 expect(fieldRange('cpu','process',base)).toEqual({min:180,max:350});expect(fieldRange('cpu','process',[...base,'cpu-process-1']).min).toBeLessThan(180);
 expect(evaluateHardware('cpu',defaultSpec('cpu'),[...base,'cpu-process-1']).power).toBe(a.power);
 const dual={...defaultSpec('cpu'),cores:2,clock:.7,cooling:60};
 expect(()=>evaluateHardware('cpu',dual,base)).toThrow(/コア数/);
 expect(evaluateHardware('cpu',dual,[...base,'cpu-cores-1']).performance).toBeGreaterThan(a.performance);
});
it('slider ranges start narrow, grow monotonically with research and reach the absolute bound at the last stage',()=>{
 for(const kind of hardwareKinds)for(const [key,field] of designFields(kind)){
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
  expect(field.lowerIsBetter?previous.min:previous.max,`${kind}.${key}`).toBe(Number(field.lowerIsBetter?field.min:field.max));
 }
});
it('list-valued hardware sliders contain their bounds, default and starting limit, and only unlock listed values',()=>{
 for(const kind of hardwareKinds)for(const [key,field] of designFields(kind)){
  if(!field.values)continue;
  for(const v of [field.min,field.max,field.default,field.unlock?.from])expect(field.values,`${kind}.${key} ${v}`).toContain(v);
  for(let level=0;level<=50;level+=7){
   const s={research:{completed:[`${kind}-compute-1`]}};if(level)for(const axis of field.unlock!.axes)unlockBranch(s,kind,axis,level);
   const r=fieldRange(kind,key,s.research.completed);expect(field.values).toContain(field.lowerIsBetter?r.min:r.max);
  }
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
 expect(unlockedRange(aiDesignSliders.context,'ai',['ai-compute-1','ai-contextLength-1']).max).toBe(65536);
});
it('device research widens case cooling and makes each watt of cooling cheaper instead of multiplying performance',()=>{
 const s=createGame({id:'content',name:'技術社',difficulty:'normal',seed:42});s.research.completed=['pc-compute-1'];
 const parts={cpu:'v-cpu',gpu:'v-gpu',motherboard:'v-board',ram:'v-ram',storage:'v-storage'};
 const a=evaluateDevice(s,parts,'gaming','pc',undefined,false,150);
 expect(()=>evaluateDevice(s,parts,'gaming','pc',undefined,false,300)).toThrow(/冷却性能は現在の研究では30～200W/);
 unlockBranch(s,'pc','cooling',2);const b=evaluateDevice(s,parts,'gaming','pc',undefined,false,150);
 expect(b.unitCost).toBeLessThan(a.unitCost);expect(b.performance).toBe(a.performance);expect(b.power).toBe(a.power);
 expect(evaluateDevice(s,parts,'gaming','pc',undefined,false,260).power).toBe(a.power);
 expect(()=>evaluateDevice(s,parts,'gaming','pc',undefined,false,50)).toThrow(/冷却性能が不足しています（消費電力 \d+W \/ 冷却性能 50W）/);
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
 const s=createGame({id:'long',name:'長期社',difficulty:'normal',seed:42});const a=cmd(s,{type:'advance',days:365}),b=cmd(cmd(s,{type:'advance',days:180}),{type:'advance',days:185});expect(a).toEqual(b);expect(a.history).toHaveLength(12);expect(a.company.cash).toBeGreaterThanOrEqual(0);
});
it('seeded market events change real modifiers and expire',()=>{
 const s=createGame({id:'events',name:'市況社',difficulty:'normal',seed:1});expect((events as any).marketMonthly).toBeTypeOf('function');(events as any).marketMonthly(s);expect((s as any).pendingDecision!==null||(s as any).modifiers.demand!==1||(s as any).modifiers.production!==1).toBe(true);
 const after=cmd(s,{type:'advance',days:31});expect(after.modifiers.expiresDay===0||after.modifiers.expiresDay>after.day).toBe(true);
});
it('each OS research branch widens exactly one design slider; feature research unlocks one feature',()=>{
 const base=withTestStaff(createGame({id:'os-tech',name:'OS技術',difficulty:'normal',seed:42}));base.research.completed=['os-compute-1'];
 const design={type:'developOS',name:'OS',version:1,features:['files'],quality:.8,compatibility:.8,support:.7,price:5000};
 const a=cmd(base,design);
 const withTech=(id:string)=>({...base,research:{completed:[...base.research.completed,id],active:[]}});
 for(const key of ['quality','compatibility','support'] as const){
  const id=`os-${key}-1`;
  const before=unlockedRange(osSliders[key],'os',base.research.completed).max,after=unlockedRange(osSliders[key],'os',withTech(id).research.completed).max;
  expect(after).toBeGreaterThan(before);
  for(const other of ['quality','compatibility','support'] as const)if(other!==key)expect(unlockedRange(osSliders[other],'os',withTech(id).research.completed)).toEqual(unlockedRange(osSliders[other],'os',base.research.completed));
  expect(()=>cmd(base,{...design,[key]:after})).toThrow(/現在の研究では/);
  const b=cmd(withTech(id),{...design,[key]:after});
  expect(Number(b.products[0].spec[key])).toBe(after);expect(b.products[0].performance).toBeGreaterThan(a.products[0].performance);
  expect(cmd(withTech(id),design).products[0].performance).toBe(a.products[0].performance);
 }
 expect(()=>cmd(base,{...design,features:['files','security']})).toThrow(/OS セキュリティ機能/);
 expect(cmd(withTech('os-security-1'),{...design,features:['files','security']}).products[0].spec.features).toBe('files,security');
});
