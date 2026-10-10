import {it,expect} from 'vitest';
import {hardwareKinds} from '../packages/content/src/research';
import {researchAtShare,techById,researchBranches} from '../packages/content/src/tech-catalog';
import {fieldRange,hardwareCatalog,designFields} from '../packages/content/src/hardware';
import {deviceCooling} from '../packages/content/src/devices';
import {unlockedRange} from '../packages/content/src/unlocks';
import {evaluateHardware} from '../packages/sim/src/hardware';
import {marketReference,typicalSpec} from '../packages/sim/src/market';
import {findVendorPart,vendorPartsAt} from '../packages/sim/src/vendor-market';
import {rivalShare} from '../packages/sim/src/rivals';
import {eraBalance} from '../packages/content/src/era';
import {frontierSpec} from './research-helpers';

const at=(kind:string,share:number)=>researchAtShare(kind,share);
/** Best design of a research level that its own cooler can cool (cores/units halved until it fits). */
function fitted(kind:'cpu'|'gpu',share:number){
 const completed=at(kind,share),spec=frontierSpec(kind,completed),count=kind==='cpu'?'cores':'units';
 while(evaluateHardware(kind,spec,completed,{stored:true}).power>Number(spec.cooling)&&Number(spec[count])>1)spec[count]=Number(spec[count])/2;
 return {spec,result:evaluateHardware(kind,spec,completed,{stored:true})};
}

it('the advanced tier takes every hardware slider several times past its year-2100 bound',()=>{
 for(const kind of hardwareKinds)for(const [key,f] of designFields(kind)){
  if(!f.unlock)continue;
  const base=fieldRange(kind,key,at(kind,1)),final=fieldRange(kind,key,at(kind,2));
  const v2100=f.lowerIsBetter?base.min:base.max,v2200=f.lowerIsBetter?final.min:final.max;
  expect(v2100,`${kind}.${key}`).toBe(f.unlock.base);
  expect(v2200,`${kind}.${key}`).toBe(Number(f.lowerIsBetter?f.min:f.max));
  const growth=f.lowerIsBetter?v2100/v2200:v2200/v2100;
  // Percentages and screen sizes have natural ceilings and coolers double (they only need to cover the power draw);
  // everything else grows at least 2.5×.
  if(!['efficiency','gamut','size','slots','cooling'].includes(key))expect(growth,`${kind}.${key}`).toBeGreaterThanOrEqual(2.5);
  else expect(growth,`${kind}.${key}`).toBeGreaterThan(1);
 }
 for(const kind of ['pc','laptop'] as const){
  const f=deviceCooling[kind];
  expect(unlockedRange(f,kind,at(kind,1)).max).toBe(f.unlock.base);expect(unlockedRange(f,kind,at(kind,2)).max).toBe(f.max);
 }
});

it('hardware slider branches have 100 stages while year-2100 stages keep their research cost',()=>{
 for(const kind of hardwareKinds)for(const b of researchBranches(kind).filter(b=>b.kind==='slider'))expect(b.levels,`${kind}-${b.axis}`).toBe(100);
 expect(techById.get('cpu-cores-100')).toBeDefined();expect(techById.get('cpu-cores-101')).toBeUndefined();
 // Cost weights are taken from the first tier, so stage 1 costs what it did before the advanced tier existed.
 expect(techById.get('cpu-cores-1')!.work).toBeCloseTo(10*4/(9+1/50),6);
 expect(techById.get('cpu-cores-100')!.work).toBeGreaterThan(techById.get('cpu-cores-50')!.work*2);
 // AI and OS sliders are not tied to hardware eras and keep 50 stages.
 for(const b of researchBranches('os').filter(b=>b.kind==='slider'))expect(b.levels).toBe(50);
 expect(researchBranches('ai').every(b=>b.levels===50)).toBe(true);
 // New memory generations and a new panel type arrive in the advanced tier.
 expect(researchBranches('ram').find(b=>b.axis==='memoryGen')!.levels).toBe(83);
 expect(hardwareCatalog.monitor.fields.panel.options).toContain('Holographic');
});

it('frontier designs of the advanced tier stay within their coolers and sensible costs (no 33,000 W designs)',()=>{
 for(const [share,limit] of [[1,1000],[1.5,2000],[2,2000]] as const){
  const cpu=fitted('cpu',share).result;expect(cpu.power).toBeLessThanOrEqual(limit);
  const gpu=fitted('gpu',share).result;expect(gpu.power).toBeLessThanOrEqual(limit*1.5);
 }
 const cpu2100=fitted('cpu',1),cpu2200=fitted('cpu',2),gpu2100=fitted('gpu',1),gpu2200=fitted('gpu',2);
 // Performance keeps growing; frontier cost stays within a small multiple of a year-2100 frontier design.
 expect(cpu2200.result.performance/cpu2100.result.performance).toBeGreaterThan(10);
 expect(gpu2200.result.performance/gpu2100.result.performance).toBeGreaterThan(3);
 expect(cpu2200.result.unitCost/cpu2100.result.unitCost).toBeLessThan(2);
 expect(gpu2200.result.unitCost/gpu2100.result.unitCost).toBeLessThan(2);
});

it('the market, vendors and rivals continue past 2100 to year-2200 technology',()=>{
 const day=(year:number)=>(year-2000)*eraBalance.daysPerYear;
 for(const kind of ['cpu','gpu','ram','pc'] as const){
  expect(marketReference(kind,day(2150))).toBeGreaterThan(marketReference(kind,day(2100)));
  expect(marketReference(kind,day(2200))).toBeGreaterThan(marketReference(kind,day(2150)));
 }
 expect(Number(typicalSpec('cpu',2).process)).toBeLessThan(.1);
 expect(findVendorPart('v-2150-cpu')).toBeDefined();expect(findVendorPart('v-2200-gpu')).toBeDefined();expect(findVendorPart('v-2205-gpu')).toBeUndefined();
 expect(vendorPartsAt(day(2160)).map(p=>p.id)).toContain('v-2160-cpu');
 expect(rivalShare(1)).toBe(0);expect(rivalShare(50)).toBe(1);expect(rivalShare(99)).toBe(2);expect(rivalShare(100)).toBe(2);
});
