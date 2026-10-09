import {researchShare,type Unlock,type OptionUnlock} from './unlocks';
import {researchAxes,researchLevels,type Tech} from './research';
/**
 * Technology eras. Every game starts on 1 January 2000 with year-2000 technology; completing every stage of a
 * category's research reaches year-2100 technology. A category's technology year is the mean research share of the
 * branches that widen its design sliders, so one stage of those branches advances it by about two years.
 */
export const eraBalance={startYear:2000,endYear:2100,daysPerYear:360} as const;
const span=eraBalance.endYear-eraBalance.startYear;
/** Technology year for a research share (0..1). */
export function yearAtShare(share:number){return eraBalance.startYear+span*Math.min(1,Math.max(0,share));}
/** Research share whose technology year is `year`. */
export function shareAtYear(year:number){return Math.min(1,Math.max(0,(year-eraBalance.startYear)/span));}
/** Branches that widen a category's sliders (deduplicated, in research-axis order). */
export function eraAxes(unlocks:readonly (Unlock|OptionUnlock|undefined)[]):string[]{
 const used=new Set(unlocks.flatMap(u=>u?[...u.axes]:[]));
 return researchAxes.filter(a=>used.has(a));
}
/** Technology year a category's research has reached (fractional). */
export function techYear(completed:readonly string[],category:string,axes:readonly string[]){return yearAtShare(researchShare(completed,category,axes));}
/** Market technology share: the industry advances one research share per century of game time. */
export function marketShareAt(day:number){return shareAtYear(eraBalance.startYear+day/eraBalance.daysPerYear);}
/**
 * First calendar year when a research purchase is allowed. Previously completed research in legacy
 * saves is not removed. Early desktop technology follows real release milestones, while later
 * research advances over the 2000-2100 game timeline.
 */
export function earliestResearchYear(tech:Pick<Tech,'category'|'axis'|'level'>):number{
 const {category,axis,level}=tech;
 if(category==='ai')return Math.min(2100,2017+Math.ceil((level-1)*83/49));
 if(axis==='visual'||axis==='cost'||axis==='reliability')return eraBalance.startYear;
 if(axis==='compute'&&level===1)return eraBalance.startYear;
 if(category==='cpu'&&axis==='capacity')return Math.min(2100,Math.max(2005,2003+Math.ceil(level*100/50)));
 return Math.min(2100,eraBalance.startYear+Math.ceil((level-(axis==='compute'?1:0))*100/50));
}
/** Completed research ids equivalent to `share` of every branch of a category (used for rival designs). */
export function researchAtShare(category:string,share:number,axes:readonly string[]=researchAxes):string[]{
 const level=(axis:string)=>axis==='compute'?1+Math.round(Math.min(1,Math.max(0,share))*(researchLevels-1)):Math.round(Math.min(1,Math.max(0,share))*researchLevels);
 return axes.flatMap(axis=>Array.from({length:level(axis)},(_,i)=>`${category}-${axis}-${i+1}`));
}
/** Options of a field available at a category's research; options without a year are always available. */
export function unlockedOptions(options:readonly string[],unlock:OptionUnlock|undefined,category:string,completed:readonly string[]){
 if(!unlock)return [...options];
 const year=techYear(completed,category,unlock.axes);
 return options.filter(o=>(unlock.years[o]??eraBalance.startYear)<=year+1e-9);
}
