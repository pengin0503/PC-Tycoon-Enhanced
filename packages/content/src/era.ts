import {researchShare,type OptionUnlock} from './unlocks';
/**
 * Technology eras. Every game starts on 1 January 2000 with year-2000 technology; completing every stage of a
 * category's research reaches year-2100 technology. A category's technology year is the mean research share of its
 * slider branches, so one stage of a branch advances that specification by two years.
 */
export const eraBalance={startYear:2000,endYear:2100,daysPerYear:360} as const;
const span=eraBalance.endYear-eraBalance.startYear;
/** Technology year for a research share (0..1). */
export function yearAtShare(share:number){return eraBalance.startYear+span*Math.min(1,Math.max(0,share));}
/** Research share whose technology year is `year`. */
export function shareAtYear(year:number){return Math.min(1,Math.max(0,(year-eraBalance.startYear)/span));}
/** Technology year a category's research has reached (fractional). */
export function techYear(completed:readonly string[],category:string,axes:readonly string[]){return yearAtShare(researchShare(completed,category,axes));}
/** Market technology share: the industry advances one research share per century of game time. */
export function marketShareAt(day:number){return shareAtYear(eraBalance.startYear+day/eraBalance.daysPerYear);}
/** Options of a field available at a category's research; options without a year are always available. */
export function unlockedOptions(options:readonly string[],unlock:OptionUnlock|undefined,category:string,completed:readonly string[]){
 if(!unlock)return [...options];
 const year=techYear(completed,category,unlock.axes);
 return options.filter(o=>(unlock.years[o]??eraBalance.startYear)<=year+1e-9);
}
