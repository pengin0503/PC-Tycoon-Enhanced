import type {GameState,Product} from './types';

export type MarketPeriod=30|360|'all';
export type MarketKind=Product['kind']|'all';
export const marketLedgerDays=360;
export type MarketShareSummary={total:number,player:number|null,shares:Record<string,number>};

/** Append an observed sale, keeping the last 360 days. Acquisition never retroactively changes the seller. */
export function recordMarketSale(s:GameState,company:string,kind:Product['kind'],units:number):void{
 if(!Number.isSafeInteger(units)||units<=0)return;
 const ledger=s.marketSales;
 const entry=ledger.at(-1);
 if(entry&&entry.day===s.day&&entry.company===company&&entry.kind===kind)entry.units+=units;
 else ledger.push({day:s.day,company,kind,units});
 if(ledger.length>12000||s.day%30===0){
  const cutoff=s.day-marketLedgerDays+1;
  const first=ledger.findIndex(x=>x.day>=cutoff);
  if(first===-1)ledger.length=0;
  else if(first>0)ledger.splice(0,first);
 }
}
/** Share percent among observed simulated firms only. Returns null (not 0%) for an empty denominator. */
export function marketShareSummary(s:GameState,period:MarketPeriod,kind:MarketKind):MarketShareSummary{
 const totals:Record<string,number>={player:0};
 for(const r of s.rivals)totals[r.id]=0;
 if(period==='all'){
  for(const p of s.products)if(kind==='all'||p.kind===kind)totals.player+=p.sold;
  for(const r of s.rivals)for(const p of r.products)if(kind==='all'||p.kind===kind)totals[r.id]+=p.sold;
 }else{
  for(const sale of s.marketSales){
   if(sale.day<s.day-period+1||sale.day>s.day||(kind!=='all'&&sale.kind!==kind))continue;
   totals[sale.company]=(totals[sale.company]??0)+sale.units;
  }
 }
 const total=Object.values(totals).reduce((a,b)=>a+b,0);
 const shares=Object.fromEntries(Object.entries(totals).map(([id,n])=>[id,total?n/total*100:0]));
 return {total,player:total?shares.player:null,shares};
}
