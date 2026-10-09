/** Marks stages 1..level of a research branch (and the compute foundation each stage requires) as completed. */
export function unlockBranch<T extends {research:{completed:string[]}}>(s:T,category:string,axis:string,level:number):T{
 const add=(id:string)=>{if(!s.research.completed.includes(id))s.research.completed.push(id);};
 for(let i=1;i<=level;i++){
  if(axis!=='compute')for(let c=1;c<=Math.ceil(i/5);c++)add(`${category}-compute-${c}`);
  add(`${category}-${axis}-${i}`);
 }
 return s;
}
import {researchAtShare} from '../packages/content/src/era';
import {hardwareCatalog,fieldRange,fieldOptions,type Spec} from '../packages/content/src/hardware';
import type {HardwareKind} from '../packages/content/src/research';
/** Completes every branch of a category up to `share` of its stages (0.25 ≈ year-2025 technology). */
export function researchTo<T extends {research:{completed:string[]}}>(s:T,category:string,share:number):T{
 for(const id of researchAtShare(category,share))if(!s.research.completed.includes(id))s.research.completed.push(id);
 return s;
}
/** The best design the given research allows: every slider at its unlocked bound, the newest option of each list. */
export function frontierSpec(kind:HardwareKind,completed:readonly string[]):Spec{
 return Object.fromEntries(Object.entries(hardwareCatalog[kind].fields).map(([key,f])=>{
  if(f.options)return [key,f.optionUnlock?fieldOptions(kind,key,completed).at(-1)!:f.default];
  const r=fieldRange(kind,key,completed);return [key,f.lowerIsBetter?r.min:r.max];
 }));
}
