import {marketReference} from './market';
/** Era-relative one-time development investment, priced at 100,000-yen increments. */
export function developmentCost(kind:string,performance:number,day:number,baseCost:number){
 const reference=Math.max(1,marketReference(kind,day));
 const ratio=Math.max(0,performance)/reference;
 const multiplier=Math.max(.6,Math.min(8,.55+.45*Math.sqrt(ratio)));
 return Math.max(1,Math.round(baseCost*multiplier/100000)*100000);
}
