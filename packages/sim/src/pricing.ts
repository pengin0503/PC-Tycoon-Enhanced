import {productCatalog} from '../../content/src/devices';
/** Simulation-only, deterministic allowable product pricing, not a real-world price claim. */
export function priceRange(p:{kind:string;unitCost:number;performance:number;reliability:number;visual?:{tier:number;color?:string}}){
 const reference=productCatalog[p.kind as keyof typeof productCatalog]?.reference??1000;
 const relative=Math.max(.1,Math.min(10,p.performance/reference));
 const quality=Math.max(.1,Math.min(1,p.reliability));
 const appearance=p.visual?.tier??0;
 const min=Math.max(1,Math.floor(p.unitCost*(.5+quality*.1)));
 const multiplier=(p.kind==='os'?12:3)+2*Math.sqrt(relative);
 const max=Math.min(1000000,Math.max(min+1,Math.round(p.unitCost*multiplier*(.75+quality*.35+appearance*.07))));
 return {min,max};
}
export function assertProductPrice(price:number,p:Parameters<typeof priceRange>[0]):void{
 const {min,max}=priceRange(p);
 if(!Number.isSafeInteger(price)||price<min||price>max)throw new Error(`販売価格は${min}～${max}円の範囲で設定してください`);
}
