import type {Product} from './types';
export function inventoryValue(p:Product):number{return p.inventoryValue??p.inventory*p.unitCost;}
export function removeStock(p:Product,units:number):number{
 if(!Number.isInteger(units)||units<0||units>p.inventory)throw new Error('在庫が不足しています');
 const value=inventoryValue(p);
 const consumed=units===p.inventory?value:Math.round(value*units/p.inventory);
 p.inventory-=units;
 p.inventoryValue=value-consumed;
 return consumed;
}
export function addStock(p:Product,units:number,cost:number):void{
 if(!Number.isInteger(units)||units<0||!Number.isSafeInteger(cost)||cost<0)throw new Error('在庫原価が不正です');
 const value=inventoryValue(p);
 p.inventory+=units;
 p.inventoryValue=value+cost;
}
