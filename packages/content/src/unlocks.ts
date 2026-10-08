import {researchLevels} from './research';
/**
 * Research-gated slider ranges. A field starts with its better-side bound at `from` and moves towards its
 * absolute bound (`max`, or `min` when `lowerIsBetter`) as the listed research branches of the product
 * category are completed. Research no longer multiplies performance directly; it widens the design space.
 */
export type Unlock={axes:readonly string[],from:number};
export type RangeSpec={min?:number,max?:number,step?:number,values?:readonly number[],unlock?:Unlock,lowerIsBetter?:boolean};
export const unlockBalance={exponent:.6} as const;
/** Highest completed stage of `${category}-${axis}-N`. Prerequisites make stages consecutive. */
export function researchLevel(completed:readonly string[],category:string,axis:string){
 const prefix=`${category}-${axis}-`;let level=0;
 for(const id of completed)if(id.startsWith(prefix)){const n=Number(id.slice(prefix.length));if(Number.isInteger(n)&&n>level)level=n;}
 return level;
}
/** 0..1 share of a branch set. The first compute stage only unlocks the category, so it does not count. */
export function unlockProgress(completed:readonly string[],category:string,axes:readonly string[]){
 if(!axes.length)return 1;
 const share=axes.reduce((n,axis)=>{const level=researchLevel(completed,category,axis);
  return n+(axis==='compute'?Math.max(0,level-1)/(researchLevels-1):level/researchLevels);},0)/axes.length;
 return Math.min(1,Math.max(0,share))**unlockBalance.exponent;
}
const snap=(v:number)=>Number(v.toFixed(6));
/**
 * Current selectable range for a numeric field; always within the absolute `min`/`max`.
 * Bounds snap to `step`, or for list-valued sliders to the nearest listed value inside the unlocked span,
 * so the advertised limit is always a value the player can actually choose.
 */
export function unlockedRange(field:RangeSpec,category:string,completed:readonly string[]):{min:number,max:number}{
 const min=Number(field.min),max=Number(field.max);
 if(!field.unlock)return {min,max};
 const {step,values}=field,p=unlockProgress(completed,category,field.unlock.axes),from=field.unlock.from;
 if(field.lowerIsBetter){
  const raw=from-(from-min)*p;
  const bound=values?Math.min(...values.filter(v=>v>=raw-1e-9),from):step?min+Math.ceil((raw-min)/step-1e-9)*step:raw;
  return {min:snap(Math.max(min,bound)),max};
 }
 const raw=from+(max-from)*p;
 const bound=values?Math.max(...values.filter(v=>v<=raw+1e-9),from):step?min+Math.floor((raw-min)/step+1e-9)*step:raw;
 return {min,max:snap(Math.min(max,bound))};
}
/** Whether further research can still widen this field. */
export function canUnlockMore(field:RangeSpec,range:{min:number,max:number}){
 if(!field.unlock)return false;
 return field.lowerIsBetter?range.min>Number(field.min):range.max<Number(field.max);
}
