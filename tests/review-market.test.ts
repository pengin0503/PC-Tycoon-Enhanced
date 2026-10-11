import {expect,it} from 'vitest';
import {createGame,validateGame} from '../packages/sim/src';
import {recordMarketSale,marketShareSummary} from '../packages/sim/src/market-share';
import {exportSave,importSave} from '../packages/save/src';
it('aggregates interleaved PC/OS sales independently of model count',()=>{
 const s=createGame({id:'ledger',name:'Ledger',seed:42,difficulty:'normal'});
 for(let i=0;i<150;i++){recordMarketSale(s,'player','pc',10);recordMarketSale(s,'player','os',10);}
 expect(s.marketSales).toHaveLength(2);expect(s.marketSales.map(x=>x.units)).toEqual([1500,1500]);
});
it('normalizes legacy rows without changing shares or hiding malformed dates',()=>{
 const s=createGame({id:'old',name:'Old',seed:42,difficulty:'normal'});s.day=360;
 s.marketSales=[{day:1,company:'player',kind:'pc',units:2},{day:360,company:'player',kind:'pc',units:3},{day:360,company:'player',kind:'os',units:3},{day:360,company:'player',kind:'pc',units:4}];
 const restored=importSave(JSON.stringify(s));expect(restored.marketSales).toHaveLength(3);
 expect(marketShareSummary(restored,360,'pc').total).toBe(9);
 expect(()=>validateGame({...s,marketSales:[{day:361,company:'player',kind:'pc',units:1}]})).toThrow();
 expect(()=>validateGame({...s,marketSales:[{day:360,company:'player',kind:'pc',units:-1}]})).toThrow();
});
it('keeps 360 days of the full 11 company / 10 kind daily grid saveable',()=>{
 const s=createGame({id:'full',name:'Full',seed:42,difficulty:'normal'});
 const kinds=['cpu','gpu','motherboard','ram','storage','psu','monitor','pc','laptop','os'] as const;
 for(let day=1;day<=361;day++){s.day=day;for(let c=0;c<11;c++)for(const kind of kinds)recordMarketSale(s,c?'r-'+c:'player',kind,100);}
 expect(s.marketSales).toHaveLength(39600);expect(s.marketSales[0].day).toBe(2);
 expect(()=>importSave(exportSave(s))).not.toThrow();
});
