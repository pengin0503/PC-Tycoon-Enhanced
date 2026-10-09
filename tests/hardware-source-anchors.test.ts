import {it,expect} from 'vitest';
import {hardwareCatalog} from '../packages/content/src/hardware';
import {historicalLimit,typicalRetailLimit} from '../packages/content/src/historical-limits';
import {typicalSpec} from '../packages/sim/src/market';
import {shareAtYear} from '../packages/content/src/era';
import {hardwarePerformance} from '../packages/sim/src/hardware';
import {verifiedHardwareAnchors} from '../packages/content/src/hardware-evidence';

it('all 7 hardware categories have published-source benchmark anchors with explicit physical units (#33)',()=>{
 expect(new Set(verifiedHardwareAnchors.map(a=>a.kind)).size).toBe(7);
 for(const a of verifiedHardwareAnchors){
  expect(a.source).toMatch(/^https:\/\//);
  expect(a.product.length).toBeGreaterThan(3);
  expect(a.year).toBeLessThanOrEqual(2025);
  expect(a.note).toMatch(/非|対象|単位|仮定/);
  if(typeof a.value==='number'){
   expect(Number.isFinite(a.value)&&a.value>0).toBe(true);
   expect(a.unit.length).toBeGreaterThan(0);
  }
 }
});
it('published 2025 high-end figures fit virtual market envelope, not mandatory player research caps',()=>{
 for(const a of verifiedHardwareAnchors.filter(a=>typeof a.value==='number'&&a.referenceField)){
  const field=hardwareCatalog[a.kind].fields[a.referenceField!];
  const cap=historicalLimit(a.kind,a.referenceField!,a.year,field);
  if(cap!==undefined)expect(cap, `${a.product} ${a.referenceField}`).toBeGreaterThanOrEqual(a.value as number);
 }
 expect(historicalLimit('storage','speed',2025,hardwareCatalog.storage.fields.speed)).toBeGreaterThanOrEqual(14800);
 expect(typicalRetailLimit('cpu','cores',2025)).toBeLessThan(32);
});
it('simulation performance for 7 kinds rises with market progress, without treating IPC scores as FLOPS',()=>{
 for(const kind of Object.keys(hardwareCatalog) as (keyof typeof hardwareCatalog)[]){
  const early=typicalSpec(kind,shareAtYear(2000)),late=typicalSpec(kind,shareAtYear(2025));
  expect(hardwarePerformance(kind,late),kind).toBeGreaterThanOrEqual(hardwarePerformance(kind,early));
 }
});
