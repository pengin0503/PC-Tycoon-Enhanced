import {researchShare,type OptionUnlock} from './unlocks';
import {maxResearchShare} from './research';
/**
 * Technology eras. Every game starts on 1 January 2000 with year-2000 technology. Research share 1 (stage 50 of every
 * branch) is year-2100 technology; the advanced tier (stages 51–100 of hardware slider branches) continues to year 2200.
 * A category's technology year is the mean research share of its slider branches, so one stage of a branch advances
 * that specification by two years.
 */
export const eraBalance={startYear:2000,baseEndYear:2100,endYear:2200,yearsPerShare:100,daysPerYear:360} as const;
/** Technology years per research stage. */
export const yearsPerStage=2;
const clampShare=(share:number)=>Math.min(maxResearchShare,Math.max(0,share));
/** Technology year for a research share (0..2). */
export function yearAtShare(share:number){return eraBalance.startYear+eraBalance.yearsPerShare*clampShare(share);}
/** Research share whose technology year is `year`. */
export function shareAtYear(year:number){return clampShare((year-eraBalance.startYear)/eraBalance.yearsPerShare);}
/** Technology year a category's research has reached (fractional). */
export function techYear(completed:readonly string[],category:string,axes:readonly string[]){return yearAtShare(researchShare(completed,category,axes));}
/** Market technology share: the industry advances one research share per century of game time, up to year 2200. */
/** Calendar year of game `day` (day 0 is 1 January 2000). */
export function calendarYearAt(day:number){return eraBalance.startYear+Math.floor(Math.max(0,day)/eraBalance.daysPerYear);}
export function marketShareAt(day:number){return shareAtYear(eraBalance.startYear+day/eraBalance.daysPerYear);}
/** Options of a field available at a category's research; options without a year are always available. */
export function unlockedOptions(options:readonly string[],unlock:OptionUnlock|undefined,category:string,completed:readonly string[]){
 if(!unlock)return [...options];
 const year=techYear(completed,category,unlock.axes);
 return options.filter(o=>(unlock.years[o]??eraBalance.startYear)<=year+1e-9);
}
