import {income} from './finance';
import {recordMarketSale} from './market-share';
import type {GameState,Product} from './types';

/** Records one sale and allocates any bundled OS license without duplicating cash income. */
export function recordProductSale(s:GameState,p:Product,units:number,unitPrice:number,actualCost:number):void{
 const bundled=p.spec.osId?s.products.find(os=>os.id===p.spec.osId&&os.kind==='os'):undefined;
 const license=bundled?Math.min(unitPrice,bundled.price):0;
 const productRevenue=units*(unitPrice-license);
 recordMarketSale(s,'player',p.kind,units);
 p.sold+=units;p.lastSaleDay=s.day;
 p.revenue+=productRevenue;
 p.profit+=productRevenue+units*(bundled?.unitCost??0)-actualCost;
 if(bundled){
  recordMarketSale(s,'player','os',units);
  bundled.sold+=units;bundled.lastSaleDay=s.day;
  bundled.revenue+=units*license;
  bundled.profit+=units*(license-bundled.unitCost);
 }
 income(s,units*unitPrice);
}
