import type {Field} from './hardware';

/**
 * Evidence-anchored milestones with *gameplay-interpolated* intermediate maxima.
 * No dates after 2025 purport to predict real releases. IPC-equivalent / GPU "units" remain abstract.
 * Source attribution and uncertainty levels: docs/dev/HISTORICAL_HARDWARE_CALIBRATION.md.
 */
export const milestoneYears=[2000,2002,2005,2008,2012,2017,2020,2025] as const;
type Timeline=readonly number[];
const maxByYear:Record<string,Timeline>={
 'cpu.cores':[1,1,2,4,8,16,64,192],
 'cpu.clock':[1.5,3.1,3.8,4.0,4.5,5.0,5.3,6],
 'cpu.process':[180,130,90,45,22,14,7,3],
 'gpu.vram':[.064,.128,.256,1,6,12,24,32],
 'gpu.bandwidth':[5.3,11,35,120,288,484,936,1792],
 'gpu.process':[180,150,110,65,28,14,7,4],
 'ram.capacity':[1,2,4,8,16,32,64,128],
 'ram.speed':[266,400,800,1600,2400,4000,4800,8000],
 'storage.capacity':[100,250,500,1000,4000,16000,24000,36000],
 'storage.speed':[60,100,150,300,600,3500,7000,14000],
 'psu.wattage':[500,600,1000,1200,1500,1600,1800,2000],
 'monitor.resolution':[1200,1200,1600,1600,2160,4320,4320,8640],
 'monitor.refresh':[120,120,120,144,144,240,360,540],
};
/** Returns a conservative gameplay ceiling/floor, not a benchmark or historical market median. */
export function historicalLimit(kind:string,key:string,year:number,field:Field):number|undefined{
 const table=maxByYear[`${kind}.${key}`];
 if(!table)return undefined;
 const j=milestoneYears.findIndex(y=>year<y);
 const cap=j<0?table.at(-1)!:table[Math.max(0,j-1)];
 if(year<=2025)return cap;
 const far=field.lowerIsBetter?Number(field.min):Number(field.max);
 const proportion=Math.min(1,Math.max(0,(year-2025)/75));
 return cap*(far/cap)**proportion;
}
/** Calendar ceilings intersect research-unlocked slider limits, snapping to actual supported choice values. */
export function historicalRange(kind:string,key:string,field:Field,range:{min:number,max:number},year:number){
 const cap=historicalLimit(kind,key,year,field);
 if(cap===undefined)return range;
 const values=field.values?.filter(v=>v>=range.min-1e-9&&v<=range.max+1e-9);
 if(field.lowerIsBetter){
  const allowed=values?.filter(v=>v>=cap-1e-9).sort((a,b)=>a-b)[0];
  return {...range,min:Math.min(range.max,Math.max(range.min,allowed??cap))};
 }
 const allowed=values?.filter(v=>v<=cap+1e-9).sort((a,b)=>b-a)[0];
 return {...range,max:Math.max(range.min,Math.min(range.max,allowed??cap))};
}
