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
 'storage.speed':[60,100,150,300,600,3500,7000,15000],
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

/** Typical retail segment balance targets. These are intentionally *not* historical maximum products and do not
 * constrain what a player can invent with research; they cap the baseline AI/rival market forecasts only.
 * Numerical rows are gameplay estimates, not claims about a measured global-average machine.
 */
const retailTypical:Record<string,Timeline>={
 'cpu.cores':[1,1,2,4,4,8,12,16],
 'cpu.clock':[.8,2.0,3,3.3,3.7,4.0,4.5,5.0],
 'gpu.vram':[.032,.064,.128,.512,2,8,12,16],
 'gpu.bandwidth':[3,8,24,60,150,320,448,700],
 'ram.capacity':[.128,.256,.512,2,4,8,16,32],
 'storage.capacity':[20,80,160,500,1000,2000,4000,8000],
};
/** Soft world-market retail target by release year, never used to gate player research or design. */
export function typicalRetailLimit(kind:string,key:string,year:number):number|undefined{
 const row=retailTypical[`${kind}.${key}`];if(!row)return undefined;
 const j=milestoneYears.findIndex(y=>year<y);
 if(j<0){const last=row.at(-1)!;return year>2025?last*2**((Math.min(year,2100)-2025)/10):last;}
 return row[Math.max(0,j-1)];
}
