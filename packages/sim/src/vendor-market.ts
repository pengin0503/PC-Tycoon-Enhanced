import {vendorParts,deviceSlots} from '../../content/src/devices';
import {marketShareAt,eraBalance} from '../../content/src/era';
import {typicalSpec} from './market';
import {evaluateHardware} from './hardware';
import type {DeviceSlot} from '../../content/src/devices';

/** Immutable synthetic retail generations. IDs identify the *release-year* specification, not the current market.
 * This keeps old PC bills of materials and saves stable as suppliers release new designs.
 */
function generatedVendor(year:number,kind:DeviceSlot){
 const share=marketShareAt((year-eraBalance.startYear)*eraBalance.daysPerYear);
 const spec=typicalSpec(kind,share);
 const metrics=evaluateHardware(kind,spec,[],{stored:true});
 return {id:`v-${year}-${kind}`,name:`汎用 ${kind.toUpperCase()}（${year}年型）`,kind,spec,
  performance:metrics.performance,power:metrics.power,unitCost:Math.max(1,Math.round(metrics.unitCost*1.8))};
}
const cache=new Map<string,ReturnType<typeof generatedVendor>>();
/** Generated part IDs never change meaning; old 2000-vendor IDs remain available indefinitely. */
export function findVendorPart(id:string|undefined){
 if(!id)return undefined;
 const legacy=vendorParts.find(x=>x.id===id);if(legacy)return legacy;
 const match=/^v-(20\d\d|2100)-(cpu|gpu|motherboard|ram|storage|psu)$/.exec(id);
 if(!match)return undefined;
 const year=Number(match[1]),kind=match[2] as DeviceSlot;
 if(year<=2000||year%5!==0||year>2100)return undefined;
 let hit=cache.get(id);if(!hit){hit=generatedVendor(year,kind);cache.set(id,hit);}
 return hit;
}
/** The current catalog rotates every five game-years; historical parts resolve through findVendorPart. */
export function vendorPartsAt(day:number){
 const year=Math.min(2100,2000+Math.floor(Math.max(0,day)/(eraBalance.daysPerYear*5))*5);
 return year<=2000?vendorParts:deviceSlots.map(kind=>findVendorPart(`v-${year}-${kind}`)!).filter(Boolean);
}
