import {researchLevels,maxResearchShare} from './research';
/**
 * Research-gated slider ranges. A field starts with its better-side bound at `from` and moves towards its
 * absolute bound (`max`, or `min` when `lowerIsBetter`) as its own research branch (`axes`, normally the field key)
 * of the product category is completed. Research does not multiply performance; it widens the design space.
 * `log` fields grow geometrically (cores, capacities, bandwidths), so each stage multiplies the bound instead of
 * adding a fixed amount; the hardware catalog uses them to go from year-2000 technology to year-2200 technology.
 * `base`: the year-2100 bound of a field with an advanced tier. Stages 1–50 open `from` → `base`; stages 51–100
 * continue `base` → the absolute bound (year-2200 technology). Fields without `base` reach their absolute bound at stage 50.
 */
export type Unlock={axes:readonly string[],from:number,log?:boolean,base?:number};
export type RangeSpec={min?:number,max?:number,step?:number,values?:readonly number[],unlock?:Unlock,lowerIsBetter?:boolean};
export const unlockBalance={exponent:.6} as const;
/** Highest completed stage of `${category}-${axis}-N`. Prerequisites make stages consecutive. */
export function researchLevel(completed:readonly string[],category:string,axis:string){
 const prefix=`${category}-${axis}-`;let level=0;
 for(const id of completed)if(id.startsWith(prefix)){const n=Number(id.slice(prefix.length));if(Number.isInteger(n)&&n>level)level=n;}
 return level;
}
/**
 * Mean completed share of a branch set, `level / researchLevels` per branch: 1 is year-2100 technology (stage 50),
 * 2 is year-2200 technology (stage 100 of the advanced tier).
 */
export function researchShare(completed:readonly string[],category:string,axes:readonly string[]){
 if(!axes.length)return 1;
 const share=axes.reduce((n,axis)=>n+researchLevel(completed,category,axis)/researchLevels,0)/axes.length;
 return Math.min(maxResearchShare,Math.max(0,share));
}
/**
 * Open fraction of a branch set: 0 = the starting limit, 1 = the year-2100 bound, 2 = the final bound. Within each tier
 * the share is raised to `unlockBalance.exponent`, so early stages of a tier open noticeably.
 */
export function openFraction(share:number){
 const s=Math.min(maxResearchShare,Math.max(0,share)),e=unlockBalance.exponent;
 return s<=1?s**e:1+(s-1)**e;
}
export function unlockProgress(completed:readonly string[],category:string,axes:readonly string[]){
 return openFraction(researchShare(completed,category,axes));
}
/** Absolute better-side bound (`max`, or `min` when lower is better): year-2200 technology for advanced-tier fields. */
export const finalBound=(field:RangeSpec)=>Number(field.lowerIsBetter?field.min:field.max);
/** Better-side bound at year-2100 technology (the end of the first research tier). */
export const baseBound=(field:RangeSpec)=>field.unlock?.base??finalBound(field);
/** Highest open fraction a field can reach: 2 with an advanced tier, otherwise 1. */
const maxFraction=(field:RangeSpec)=>field.unlock?.base===undefined?1:2;
const snap=(v:number)=>Number(v.toFixed(6));
/** Better-side bound at open fraction `p`, before snapping to the slider's step or list. */
export function rawBound(field:RangeSpec&{unlock:Unlock},p:number){
 const q=Math.min(maxFraction(field),Math.max(0,p));
 const [from,to,t]=q<=1?[field.unlock.from,baseBound(field),q]:[baseBound(field),finalBound(field),q-1];
 return field.unlock.log?from*(to/from)**t:from+(to-from)*t;
}
/** Snaps a bound to a value the player can choose: the nearest list value or step on the worse side of `raw`. */
function snapBound(field:RangeSpec&{unlock:Unlock},raw:number){
 const {step,values,lowerIsBetter}=field,min=Number(field.min),from=field.unlock.from;
 if(lowerIsBetter)return values?Math.min(...values.filter(v=>v>=raw-1e-9),from):step?min+Math.ceil((raw-min)/step-1e-9)*step:raw;
 return values?Math.max(...values.filter(v=>v<=raw+1e-9),from):step?min+Math.floor((raw-min)/step+1e-9)*step:raw;
}
/** Selectable range at open fraction `p` (0 = the starting limit, 1 = year-2100 bounds, 2 = the absolute bounds). */
export function rangeAtProgress(field:RangeSpec,p:number):{min:number,max:number}{
 const min=Number(field.min),max=Number(field.max);
 if(!field.unlock)return {min,max};
 const unlocked=field as RangeSpec&{unlock:Unlock};
 const bound=snapBound(unlocked,rawBound(unlocked,p));
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
 const raw=rawBound(field as RangeSpec&{unlock:Unlock},p),from=field.unlock.from;
 return field.lowerIsBetter?from/raw:raw/from;
}
/** Option choices (e.g. memory generations) that appear at given technology years of a category. */
export type OptionUnlock={axes:readonly string[],years:Readonly<Record<string,number>>};
