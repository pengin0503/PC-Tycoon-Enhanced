import {deviceSlots} from '../../content/src/devices';
import type {GameState,Product} from './types';
export const stockDefault={retail:0,assembly:0,ai:0} as const;
/** Retail stock is the quantity that may be sold without consuming stock reserved for internal users.
 * Before custom settings exist, retain the original assembly-priority and automatic AI buffer.
 */
export function availableForRetail(s:GameState,p:Product,openingInventory=p.inventory):number{
 const stock=Math.min(p.inventory,openingInventory);
 if(p.kind==='os')return stock;
 if(p.stockAllocation){
  return Math.max(0,stock-p.stockAllocation.assembly-p.stockAllocation.ai);
 }
 const feedsAssembly=s.products.some(device=>(device.kind==='pc'||device.kind==='laptop')&&device.launched&&device.line&&deviceSlots.some(slot=>device.spec[slot]===p.id));
 if(feedsAssembly)return 0;
 const canSupplyAi=s.research.completed.includes('ai-compute-1')&&(p.kind==='gpu'||(p.kind==='pc'&&p.spec.purpose==='server'));
 const aiReserve=canSupplyAi&&p.line?Math.min(2,Math.max(0,p.target-1),p.inventory):0;
 return Math.max(0,stock-aiReserve);
}
/** Protect externally promised stock and AI reservations from being consumed by assembly. */
export function availableForAssembly(part:Product):number{
 return Math.max(0,part.inventory-(part.stockAllocation?.retail??0)-(part.stockAllocation?.ai??0));
}
/** Keep external and assembly allocations safe when transferring stock to a GPU cluster. */
export function availableForAI(part:Product):number{
 return Math.max(0,part.inventory-(part.stockAllocation?.retail??0)-(part.stockAllocation?.assembly??0));
}
