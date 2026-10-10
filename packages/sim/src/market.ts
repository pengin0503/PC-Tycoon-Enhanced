import {designFields,defaultSpec,type Spec} from '../../content/src/hardware';
import {productCatalog,deviceBalance} from '../../content/src/devices';
import {frontierGrowth,unlockBalance} from '../../content/src/unlocks';
import {marketShareAt,unlockedOptions,eraBalance} from '../../content/src/era';
import {researchAtShare} from '../../content/src/tech-catalog';
import {hardwareKinds,type HardwareKind} from '../../content/src/research';
import {hardwarePerformance} from './hardware';
import {historicalRange,typicalRetailLimit} from '../../content/src/historical-limits';

/** Years from which an option is the mainstream choice of the market (when later than its first availability). */
const mainstreamOptionYears:Record<string,Record<string,number>>={'monitor.panel':{TN:2000,VA:2006,IPS:2012,OLED:2035,MicroLED:2050}};
const isHardware=(kind:string):kind is HardwareKind=>(hardwareKinds as readonly string[]).includes(kind);
/**
 * Mainstream specification of a component when the industry has reached `share` of the 2000→2100 technology span:
 * the year-2000 default scaled by how far the frontier has grown, snapped to a selectable value, with the newest
 * memory generation of that time. Rivals build these and the market judges performance against them.
 */
export function typicalSpec(kind:HardwareKind,share:number):Spec{
 const p=Math.min(1,Math.max(0,share))**unlockBalance.exponent;const spec=defaultSpec(kind);
 const calendarYear=eraBalance.startYear+Math.floor(Math.min(1,Math.max(0,share))*100);
 for(const [key,f] of designFields(kind)){
  if(f.options){if(f.optionUnlock){const mainstream=mainstreamOptionYears[`${kind}.${key}`]??f.optionUnlock.years;spec[key]=unlockedOptions(f.options,f.optionUnlock,kind,researchAtShare(kind,share)).filter(v=>(mainstream[v]??2000)<=calendarYear).at(-1)??f.default;}continue;}
  if(!f.unlock)continue;
  const growth=frontierGrowth(f,p),min=Number(f.min),max=Number(f.max),base=Number(f.default);
  const raw=Math.min(max,Math.max(min,f.lowerIsBetter?base/growth:base*growth));
  const physical=historicalRange(kind,key,f,{min,max},calendarYear);
  const mainstream=typicalRetailLimit(kind,key,calendarYear);
  const target=f.lowerIsBetter?Math.max(raw,physical.min):Math.min(raw,physical.max,mainstream??max);
  // Snap to a value a designer could choose, on the worse side of the target.
  let v=target;
  if(f.values)v=f.lowerIsBetter?Math.min(...f.values.filter(x=>x>=target-1e-9)):Math.max(...f.values.filter(x=>x<=target+1e-9),min);
  else if(f.step)v=Number((min+(f.lowerIsBetter?Math.ceil((target-min)/f.step-1e-9):Math.floor((target-min)/f.step+1e-9))*f.step).toFixed(6));
  spec[key]=v;
 }
 return spec;
}
const cache=new Map<string,number>();
/** Market expectations change once a month. */
const bucket=(day:number)=>Math.floor(Math.max(0,day)/30)*30;
/**
 * Performance a mainstream product of `kind` has on `day`. Demand, review scores, price ranges and benchmark loads
 * compare against it, so a product's appeal fades as the industry moves on. It never falls below the catalog
 * reference (the year-2000 mainstream); OS scores do not depend on hardware eras.
 */
export function marketReference(kind:string,day:number):number{
 const catalog=productCatalog[kind as keyof typeof productCatalog]?.reference??1000;
 if(kind==='os')return catalog;
 const key=`${kind}:${bucket(day)}`;const hit=cache.get(key);if(hit!==undefined)return hit;
 const share=marketShareAt(bucket(day));let value=catalog;
 if(isHardware(kind))value=Math.max(catalog,hardwarePerformance(kind,typicalSpec(kind,share)));
 else if(kind==='pc'||kind==='laptop'){
  const parts=(['cpu','gpu','ram','storage'] as const).map((k,i)=>hardwarePerformance(k,typicalSpec(k,share))/deviceBalance.referencePerformance[i]);
  value=Math.max(catalog,catalog*parts.reduce((n,x,i)=>n*Math.max(1,x)**deviceBalance.purposeWeights.gaming[i],1));
 }
 if(cache.size>2000)cache.clear();
 cache.set(key,value);return value;
}
/** Calendar year the market has reached on `day` (games start in 2000). */
export function marketYear(day:number){return eraBalance.startYear+Math.floor(day/eraBalance.daysPerYear);}
