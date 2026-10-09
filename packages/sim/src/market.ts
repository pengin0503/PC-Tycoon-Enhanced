import {hardwareCatalog,defaultSpec,type Spec} from '../../content/src/hardware';
import {productCatalog,deviceBalance} from '../../content/src/devices';
import {frontierGrowth,unlockBalance} from '../../content/src/unlocks';
import {marketShareAt,researchAtShare,unlockedOptions,eraBalance} from '../../content/src/era';
import {hardwareKinds,type HardwareKind} from '../../content/src/research';
import {hardwarePerformance} from './hardware';

const isHardware=(kind:string):kind is HardwareKind=>(hardwareKinds as readonly string[]).includes(kind);
/**
 * Mainstream specification of a component when the industry has reached `share` of the 2000→2100 technology span:
 * the year-2000 default scaled by how far the frontier has grown, snapped to a selectable value, with the newest
 * memory generation of that time. Rivals build these and the market judges performance against them.
 */
export function typicalSpec(kind:HardwareKind,share:number):Spec{
 const p=Math.min(1,Math.max(0,share))**unlockBalance.exponent;const spec=defaultSpec(kind);
 for(const [key,f] of Object.entries(hardwareCatalog[kind].fields)){
  if(f.options){if(f.optionUnlock)spec[key]=unlockedOptions(f.options,f.optionUnlock,kind,researchAtShare(kind,share)).at(-1)??f.default;continue;}
  if(!f.unlock)continue;
  const growth=frontierGrowth(f,p),min=Number(f.min),max=Number(f.max),base=Number(f.default);
  const raw=Math.min(max,Math.max(min,f.lowerIsBetter?base/growth:base*growth));
  let v=raw;
  if(f.values)v=f.lowerIsBetter?Math.min(...f.values.filter(x=>x>=raw-1e-9)):Math.max(...f.values.filter(x=>x<=raw+1e-9));
  else if(f.step)v=Number((min+(f.lowerIsBetter?Math.ceil((raw-min)/f.step-1e-9):Math.floor((raw-min)/f.step+1e-9))*f.step).toFixed(6));
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
