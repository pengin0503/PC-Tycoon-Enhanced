import {hardwareKinds,type HardwareKind} from '../../../packages/content/src/research';
import {designFields,fieldRange} from '../../../packages/content/src/hardware';
import {deviceCooling} from '../../../packages/content/src/devices';
import {unlockedRange,canUnlockMore} from '../../../packages/content/src/unlocks';
import {researchPointCost,hasRole} from '../../../packages/sim/src/business';
import {nextStage} from '../../../packages/sim/src/hardware';
import type {GameState} from '../../../packages/sim/src/index';
import {branchName} from './research-hints';

/**
 * The stages of one branch the company can research right now, in order: as many as its research points pay for.
 * Each stage still needs its own prerequisites; the simulation checks them again stage by stage.
 */
export function branchPlan(s:GameState,category:string,axis:string,limit=100){
 if(!hasRole(s,'research'))return {stages:0,cost:0,next:nextStage(s.research.completed,category,axis)};
 const completed=[...s.research.completed];let points=s.company.researchPoints,stages=0,cost=0;
 const next=nextStage(completed,category,axis);
 for(let t=next;t&&stages<limit;t=nextStage(completed,category,axis)){
  if(t.prerequisites.some(p=>!completed.includes(p))||s.research.active.some(r=>r.id===t!.id))break;
  const price=researchPointCost({...s,research:{...s.research,completed}},t.id);
  if(price>points)break;
  points-=price;cost+=price;stages++;completed.push(t.id);
 }
 return {stages,cost,next};
}

export type Recommendation={category:string,axis:string,label:string,reason:string};
/**
 * Branches worth researching next: sliders the company's newest design of each kind already uses at their research
 * limit, and coolers that its newest CPU, GPU, PC or laptop fills almost completely (more cooling allows faster designs).
 */
export function researchRecommendations(s:GameState,max=4):Recommendation[]{
 const out:Recommendation[]=[];
 const add=(category:string,axis:string,reason:string)=>{if(!out.some(r=>r.category===category&&r.axis===axis))out.push({category,axis,label:branchName(category,axis),reason});};
 const latest=[...s.products].reverse();
 for(const p of latest){
  if((hardwareKinds as readonly string[]).includes(p.kind)){
   const kind=p.kind as HardwareKind;
   if(latest.find(x=>x.kind===kind)!==p)continue;
   for(const [key,f] of designFields(kind)){
    if(!f.unlock||typeof p.spec[key]!=='number')continue;
    const range=fieldRange(kind,key,s.research.completed),v=Number(p.spec[key]);
    const atLimit=f.lowerIsBetter?v<=range.min+1e-9:v>=range.max-1e-9;
    if(!atLimit||!canUnlockMore(f,range))continue;
    add(kind,key,`最新の「${p.name}」が上限です`);
   }
   // A design whose power nearly fills the cooler the research allows needs more cooling before it can go faster.
   const cooler=designFields(kind).find(([k])=>k==='cooling')?.[1];
   if(cooler?.unlock){const range=fieldRange(kind,'cooling',s.research.completed);if(p.power>=range.max*.9&&canUnlockMore(cooler,range))add(kind,'cooling','冷却が消費電力ぎりぎりです');}
  }else if(p.kind==='pc'||p.kind==='laptop'){
   if(latest.find(x=>x.kind===p.kind)!==p||typeof p.spec.cooling!=='number')continue;
   const f=deviceCooling[p.kind],range=unlockedRange(f,p.kind,s.research.completed);
   if(p.power>=Number(p.spec.cooling)*.9&&canUnlockMore(f,range))add(p.kind,'cooling','冷却が消費電力ぎりぎりです');
  }
  if(out.length>=max)break;
 }
 return out.slice(0,max).filter(r=>nextStage(s.research.completed,r.category,r.axis));
}
/** Research screen link that opens one branch (used by the development screen's research limits). */
export const researchLink=(category:string,axis:string)=>`#/research?category=${encodeURIComponent(category)}&axis=${encodeURIComponent(axis)}`;
/** Branch filter carried by a research link, if any. */
export function researchLinkFilter(hash:string=typeof location==='undefined'?'':location.hash){
 const query=new URLSearchParams(hash.split('?')[1]??'');
 return {category:query.get('category')??'',axis:query.get('axis')??''};
}
