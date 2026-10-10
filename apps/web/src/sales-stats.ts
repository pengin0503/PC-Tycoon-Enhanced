import type {GameState} from '../../../packages/sim/src/index';

/** Days without a sale after which an on-sale product is flagged for discontinuation. */
const staleDays=90;
/** Why an on-sale product may be worth discontinuing, or '' (no sale for `staleDays`, or sold below cost). */
export function discontinueHint(day:number,p:GameState['products'][number]){
 if(!p.launched||p.discontinuedDay!==undefined)return '';
 if(p.price<p.unitCost)return '原価割れ';
 return day-(p.lastSaleDay??p.releaseDay)>=staleDays?`${staleDays}日以上販売なし`:'';
}
/** Monthly units sold and revenue of one product kind (or all), from the per-kind totals in the monthly history. */
export function monthlyKindSales(history:GameState['history'],kind:string){
 const total=(h:GameState['history'][number])=>{const k=h.kinds!;const rows=kind==='all'?Object.values(k):[k[kind as keyof typeof k]];return rows.reduce((n,r)=>({sold:n.sold+(r?.sold??0),revenue:n.revenue+(r?.revenue??0)}),{sold:0,revenue:0});};
 const out:{day:number,sold:number,revenue:number}[]=[];
 for(let i=1;i<history.length;i++){
  const a=history[i-1],b=history[i];if(!a.kinds||!b.kinds)continue;
  const x=total(a),y=total(b);out.push({day:b.day,sold:Math.max(0,y.sold-x.sold),revenue:Math.max(0,y.revenue-x.revenue)});
 }
 return out;
}
