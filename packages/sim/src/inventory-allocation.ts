import {deviceSlots} from '../../content/src/devices';
import {hardwareBalance} from '../../content/src/hardware';
import type {GameState,Product} from './types';

/** Maximum next-day demand for own components from active production lines, in factory scheduling order.
 * This is a forecast, not a promise: cash, rival inventory and other dependencies can reduce actual output.
 */
export function assemblyDemand(s:GameState,part:Product):number{
 const lines=s.products.filter(p=>p.line&&p.launched&&p.kind!=='os');
 let capacity=Math.floor(hardwareBalance.baseFactoryCapacity*s.factoryLevel*s.modifiers.production);
 let needed=0;
 if(capacity<=0)return 0;
 for(let i=0;i<lines.length;i++){
  const device=lines[(i+s.day+1)%lines.length];
  const units=Math.min(Math.ceil(capacity/(lines.length-i)),Math.max(0,device.target-device.inventory));
  if(units<=0)continue;
  if(device.kind==='pc'||device.kind==='laptop')
   needed+=units*deviceSlots.filter(slot=>device.spec[slot]===part.id).length;
  capacity-=units;
 }
 return needed;
}
/** Priority for retail inventory: next-day assembly reserve, then explicit AI reserve;
 * explicit retail reserve is protected from assembly/AI, not from ordinary customer purchases.
 */
export function availableForRetail(s:GameState,p:Product,openingInventory=p.inventory):number{
 const stock=Math.min(p.inventory,openingInventory);
 if(p.kind==='os')return stock;
 const reserve=assemblyDemand(s,p);
 if(p.stockAllocation){
  return Math.max(0,stock-Math.max(reserve,p.stockAllocation.assembly)-p.stockAllocation.ai);
 }
 const canSupplyAi=s.research.completed.includes('ai-compute-1')&&(p.kind==='gpu'||(p.kind==='pc'&&p.spec.purpose==='server'));
 const aiReserve=canSupplyAi&&p.line?Math.min(2,Math.max(0,p.target-1),p.inventory):0;
 return Math.max(0,stock-reserve-aiReserve);
}
/** Assembly never consumes the stock expressly allocated to retail or AI. */
export function availableForAssembly(part:Product):number{
 return Math.max(0,part.inventory-(part.stockAllocation?.retail??0)-(part.stockAllocation?.ai??0));
}
/** AI cannot consume next-day assembly capacity or retail-protected inventory. */
export function availableForAI(s:GameState,part:Product):number{
 return Math.max(0,part.inventory-(part.stockAllocation?.retail??0)-Math.max(assemblyDemand(s,part),part.stockAllocation?.assembly??0));
}
