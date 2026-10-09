import {it,expect} from 'vitest';
import {createGame,command} from '../packages/sim/src/index';
import {marketShareSummary,recordMarketSale} from '../packages/sim/src/market-share';
import {exportSave,importSave} from '../packages/save/src/index';
const sample=()=>createGame({id:'shares',name:'自社',difficulty:'normal',seed:4});
it('reports no data, correctly filters rolling category shares and retains attribution across acquisition (#31)',()=>{
 const s=sample();
 expect(marketShareSummary(s,30,'cpu').total).toBe(0);
 expect(marketShareSummary(s,30,'cpu').player).toBeNull();
 recordMarketSale(s,'player','cpu',20);recordMarketSale(s,'r-1','cpu',30);
 recordMarketSale(s,'r-2','gpu',50);
 expect(marketShareSummary(s,30,'cpu')).toMatchObject({total:50,player:40});
 expect(marketShareSummary(s,30,'gpu')).toMatchObject({total:50,player:0});
 expect(marketShareSummary(s,360,'all').total).toBe(100);
 s.rivals[0].acquired=true;
 expect(marketShareSummary(s,30,'cpu').shares['r-1']).toBe(60);
 expect(importSave(exportSave(s)).marketSales).toEqual(s.marketSales);
 s.day=31;expect(marketShareSummary(s,30,'cpu').total).toBe(0);
 expect(marketShareSummary(s,360,'cpu').total).toBe(50);
});
it('retains bounded history without changing the old cumulative sales counters (#31)',()=>{
 const s=sample();
 for(let day=0;day<430;day++){s.day=day;recordMarketSale(s,'player','cpu',1);}
 expect(s.marketSales.length).toBeLessThanOrEqual(361);
 expect(marketShareSummary(s,30,'cpu').total).toBe(30);
 expect(marketShareSummary(s,360,'cpu').total).toBe(360);
});
