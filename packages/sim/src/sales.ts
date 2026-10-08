import {income} from './finance';
import type {GameState,Product} from './types';

/** Records one sale and allocates any bundled OS license without duplicating cash income. */
export function recordProductSale(s:GameState,p:Product,units:number,unitPrice:number,actualCost:number):void{
 const bundled=p.spec.osId?s.products.find(os=>os.id===p.spec.osId&&os.kind==='os'):undefined;
 const license=bundled?Math.min(unitPrice,bundled.price):0;
 const productRevenue=units*(unitPrice-license);
 p.sold+=units;
 p.revenue+=productRevenue;
 p.profit+=productRevenue+units*(bundled?.unitCost??0)-actualCost;
 if(bundled){
  bundled.sold+=units;
  bundled.revenue+=units*license;
  bundled.profit+=units*(license-bundled.unitCost);
 }
 income(s,units*unitPrice);
}
