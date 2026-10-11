import {productCatalog} from '../../content/src/devices';
import {hardwareBalance} from '../../content/src/hardware';
import {marketReference} from './market';
/** UI and command previews use the same monthly market reference. */
export function productPriceRange(p:Parameters<typeof priceRange>[0],day:number){return priceRange(p,marketReference(p.kind,day));}
/**
 * Simulation-only, deterministic allowable product pricing, not a real-world price claim. `reference` is the market's
 * mainstream performance for the kind (`marketReference`); it defaults to the year-2000 catalog value.
 */
export function priceRange(p:{kind:string;unitCost:number;performance:number;reliability:number;visual?:{tier:number;color?:string}},reference=productCatalog[p.kind as keyof typeof productCatalog]?.reference??1000){
 const relative=Math.max(.1,Math.min(10,p.performance/reference));
 const quality=Math.max(.1,Math.min(1,p.reliability));
 const appearance=p.visual?.tier??0;
 const min=Math.max(1,Math.floor(p.unitCost*(.5+quality*.1)));
 const multiplier=(p.kind==='os'?12:3)+2*Math.sqrt(relative);
 const max=Math.min(hardwareBalance.maxPrice,Math.max(min+1,Math.round(p.unitCost*multiplier*(.75+quality*.35+appearance*.07))));
 return {min,max};
}
export function assertProductPrice(price:number,p:Parameters<typeof priceRange>[0],reference?:number):void{
 const {min,max}=priceRange(p,reference);
 if(!Number.isSafeInteger(price)||price<min||price>max)throw new Error(`販売価格は${min}～${max}円の範囲で設定してください`);
}
