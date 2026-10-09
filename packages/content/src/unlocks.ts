import {researchLevels} from './research';
/**
 * Research-gated slider ranges. A field starts with its better-side bound at `from` and moves towards its
 * absolute bound (`max`, or `min` when `lowerIsBetter`) as the listed research branches of the product
 * category are completed. Research no longer multiplies performance directly; it widens the design space.
 * `log` fields grow geometrically (cores, capacities, bandwidths), so each stage multiplies the bound instead of
 * adding a fixed amount; the hardware catalog uses them to go from year-2000 technology to year-2100 technology.
 */
export type Unlock={axes:readonly string[],from:number,log?:boolean};
export type RangeSpec={min?:number,max?:number,step?:number,values?:readonly number[],unlock?:Unlock,lowerIsBetter?:boolean};
export const unlockBalance={exponent:.6} as const;
/** Highest completed stage of `${category}-${axis}-N`. Prerequisites make stages consecutive. */
export function researchLevel(completed:readonly string[],category:string,axis:string){
 const prefix=`${category}-${axis}-`;let level=0;
 for(const id of completed)if(id.startsWith(prefix)){const n=Number(id.slice(prefix.length));if(Number.isInteger(n)&&n>level)level=n;}
 return level;
}
/** Mean completed share (0..1) of a branch set. The first compute stage only unlocks the category, so it does not count. */
export function researchShare(completed:readonly string[],category:string,axes:readonly string[]){
 if(!axes.length)return 1;
 const share=axes.reduce((n,axis)=>{const level=researchLevel(completed,category,axis);
  return n+(axis==='compute'?Math.max(0,level-1)/(researchLevels-1):level/researchLevels);},0)/axes.length;
 return Math.min(1,Math.max(0,share));
}
/** 0..1 open fraction of a branch set: the research share raised to `unlockBalance.exponent`, so early stages open noticeably. */
export function unlockProgress(completed:readonly string[],category:string,axes:readonly string[]){
 return researchShare(completed,category,axes)**unlockBalance.exponent;
}
const snap=(v:number)=>Number(v.toFixed(6));
/** Better-side bound at open fraction `p`, before snapping to the slider's step or list. */
export function rawBound(field:RangeSpec&{unlock:Unlock},p:number){
 const from=field.unlock.from,to=Number(field.lowerIsBetter?field.min:field.max);
 return field.unlock.log?from*(to/from)**p:from+(to-from)*p;
}
/** Snaps a bound to a value the player can choose: the nearest list value or step on the worse side of `raw`. */
function snapBound(field:RangeSpec&{unlock:Unlock},raw:number){
 const {step,values,lowerIsBetter}=field,min=Number(field.min),from=field.unlock.from;
 if(lowerIsBetter)return values?Math.min(...values.filter(v=>v>=raw-1e-9),from):step?min+Math.ceil((raw-min)/step-1e-9)*step:raw;
 return values?Math.max(...values.filter(v=>v<=raw+1e-9),from):step?min+Math.floor((raw-min)/step+1e-9)*step:raw;
}
/** Selectable range at open fraction `p` (0 = the starting limit, 1 = the absolute bounds). */
export function rangeAtProgress(field:RangeSpec,p:number):{min:number,max:number}{
 const min=Number(field.min),max=Number(field.max);
 if(!field.unlock)return {min,max};
 const unlocked=field as RangeSpec&{unlock:Unlock};
 const bound=snapBound(unlocked,rawBound(unlocked,Math.min(1,Math.max(0,p))));
 return field.lowerIsBetter?{min:snap(Math.max(min,bound)),max}:{min,max:snap(Math.min(max,bound))};
}
/**
 * Current selectable range for a numeric field; always within the absolute `min`/`max`.
 * Bounds snap to `step`, or for list-valued sliders to the nearest listed value inside the unlocked span,
 * so the advertised limit is always a value the player can actually choose.
 */
export function unlockedRange(field:RangeSpec,category:string,completed:readonly string[]):{min:number,max:number}{
 return rangeAtProgress(field,field.unlock?unlockProgress(completed,category,field.unlock.axes):1);
}
/** Whether further research can still widen this field. */
export function canUnlockMore(field:RangeSpec,range:{min:number,max:number}){
 if(!field.unlock)return false;
 return field.lowerIsBetter?range.min>Number(field.min):range.max<Number(field.max);
}
/**
 * How far research has pushed a field's frontier beyond its starting limit (1 = not at all). Production technology
 * follows the frontier, so costs are computed on values divided by this growth: the same specification gets cheaper
 * as research advances, and a frontier design costs about what a frontier design cost in year 2000.
 */
export function frontierGrowth(field:RangeSpec,p:number){
 if(!field.unlock)return 1;
 const raw=rawBound(field as RangeSpec&{unlock:Unlock},Math.min(1,Math.max(0,p))),from=field.unlock.from;
 return field.lowerIsBetter?from/raw:raw/from;
}
/** Option choices (e.g. memory generations) that appear at given technology years of a category. */
export type OptionUnlock={axes:readonly string[],years:Readonly<Record<string,number>>};
