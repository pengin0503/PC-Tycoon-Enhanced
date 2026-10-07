import {hardwareCatalog,hardwareBalance as b,type Spec} from '../../content/src/hardware';
import {techById,type HardwareKind,techEffect} from '../../content/src/research';
import {expense,logEvent} from './finance';
import type {GameState,GameCommand} from './types';
export function evaluateHardware(kind:HardwareKind,spec:Spec,completed:string[]){
 const def=hardwareCatalog[kind];
 if(!completed.includes(`${kind}-compute-1`))throw new Error('基盤研究が必要です');
 if(Object.keys(spec).length!==Object.keys(def.fields).length)throw new Error('仕様の項目が不正です');
 for(const [key,field]of Object.entries(def.fields)){
  const v=spec[key];
  if(field.options){if(typeof v!=='string'||!field.options.includes(v))throw new Error(`${field.label}が不正です`);}
  else if(typeof v!=='number'||!Number.isFinite(v)||v<field.min!||v>field.max!||(field.step===1&&!Number.isInteger(v)))throw new Error(`${field.label}が不正です`);
 }
 const n=(k:string)=>Number(spec[k]);let performance=0,power=0,unitCost=0;
 switch(kind){
  case'cpu':performance=n('cores')*n('clock')*n('ipc')*b.cpu.scoreCoefficient;power=n('cores')*n('clock')**2*n('process')/14*b.cpu.powerCoefficient;unitCost=n('cores')*b.cpu.coreCost+n('clock')*b.cpu.clockCost+n('ipc')*b.cpu.ipcCost;break;
  case'gpu':performance=n('units')*n('clock')*b.gpu.scoreCoefficient*Math.min(1,n('bandwidth')/256);power=n('units')*n('clock')**2*b.gpu.powerCoefficient;unitCost=n('units')*b.gpu.unitCost+n('vram')*b.gpu.vramCost+n('bandwidth')*b.gpu.bandwidthCost;break;
  case'motherboard':performance=n('slots')*b.motherboard.slotScore+n('features')*b.motherboard.featureScore;power=10+n('features');unitCost=b.motherboard.baseCost+n('slots')*b.motherboard.slotCost+n('features')*b.motherboard.featureCost;break;
  case'ram':performance=n('capacity')*n('speed')/b.ram.scoreDivisor;power=n('capacity')*.2;unitCost=n('capacity')*b.ram.capacityCost+n('speed')*b.ram.speedCost;break;
  case'storage':performance=n('capacity')*b.storage.capacityScore+n('speed')*b.storage.speedScore;power=n('speed')*.005;unitCost=n('capacity')*b.storage.capacityCost+n('speed')*b.storage.speedCost;break;
 }
 performance*=1+Math.max(0,techEffect(completed,kind,'compute')-.08);
 return{performance:Math.round(performance),power:Math.round(power),unitCost:Math.max(1,Math.round(unitCost))};
}
export function hardwareCommand(s:GameState,c:GameCommand):boolean{
 if(c.type==='research'){
  const t=techById.get(c.id);if(!t)throw new Error('研究が存在しません');
  if(s.research.completed.includes(c.id)||s.research.active.some(r=>r.id===c.id))throw new Error('研究は開始済みです');
  if(t.prerequisites.some(id=>!s.research.completed.includes(id)))throw new Error('前提研究が必要です');
  if(s.research.active.length>=1)throw new Error('研究枠が埋まっています');
  expense(s,t.cost);s.research.active.push({id:c.id,remaining:t.work});logEvent(s,'researchStarted',t.label);return true;
 }
 if(c.type==='design'){
  if(s.products.length>=500)throw new Error('製品数の上限です');const def=hardwareCatalog[c.kind];const result=evaluateHardware(c.kind,c.spec,s.research.completed);
  expense(s,def.designCost);s.products.push({id:`p-${s.products.length+1}`,name:c.name,kind:c.kind,spec:c.spec,...result,remaining:def.work,price:c.price,inventory:0,target:0,line:false,launched:false,sold:0,revenue:0,profit:0,releaseDay:0});logEvent(s,'designStarted',c.name);return true;
 }
 return false;
}
export function researchAndDevelopment(s:GameState){
 for(const r of s.research.active)r.remaining=Math.max(0,r.remaining-b.researchPerWeek/s.research.active.length);
 for(const r of s.research.active.filter(r=>r.remaining===0)){s.research.completed.push(r.id);logEvent(s,'researchComplete',techById.get(r.id)?.label??r.id);}
 s.research.active=s.research.active.filter(r=>r.remaining>0);
 const developing=s.products.filter(p=>p.remaining>0);
 for(const p of developing){p.remaining=Math.max(0,p.remaining-b.developmentPerWeek/developing.length);if(p.remaining===0)logEvent(s,'designComplete',p.name);}
}
