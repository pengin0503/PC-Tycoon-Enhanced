import {it,expect} from 'vitest';
import {createGame,command,type GameState} from '../packages/sim/src/index';
import {defaultSpec} from '../packages/content/src/hardware';
import {importSave,exportSave} from '../packages/save/src/index';
import {priceRange} from '../packages/sim/src/pricing';
import {evaluateHardware,sellProducts} from '../packages/sim/src/hardware';
const cmd=(s:any,c:any)=>command(s,c);
function developed(kind:any='cpu',difficulty:'normal'|'hard'='normal',mode:'standard'|'tycoon'|'long'|'sandbox'='standard'){
 let s=createGame({id:'market',name:'製品社',year:2026,difficulty,seed:42,mode});
 s.company.researchPoints=10000;
 s=cmd(s,{type:'research',id:`${kind}-compute-1`});s=cmd(s,{type:'advance',days:7});
 const spec=defaultSpec(kind);const metrics=evaluateHardware(kind,spec,[...s.research.completed]);const {max}=priceRange({kind,...metrics});s=cmd(s,{type:'design',kind,name:'第一世代',spec,price:Math.min(400,max)});return cmd(s,{type:'advance',days:14});
}
function released(difficulty:'normal'|'hard'='normal',mode:'standard'|'tycoon'|'long'|'sandbox'='standard'){let s=cmd(developed('cpu',difficulty,mode),{type:'launch',id:'p-1'});return cmd(s,{type:'line',id:'p-1',target:100});}
function categoryFixture(kind:'cpu'|'os',count:number,difficulty:'normal'|'hard'='normal',mode:'standard'|'long'='standard'){
 let s:GameState;
 if(kind==='cpu'){
  s=released(difficulty,mode);
 }else{
  s=createGame({id:'market-os',name:'OS社',year:2026,difficulty,seed:42,mode});
  s.research.completed.push('os-compute-1');
  s=cmd(s,{type:'developOS',name:'Aurora',version:1,features:['files','calculator','browser'],quality:.8,compatibility:.8,support:.7,price:50});
  s=cmd(s,{type:'advance',days:14});s=cmd(s,{type:'launch',id:'p-1'});
 }
 const source=s.products[0];
 s.products=Array.from({length:count},(_,i)=>({...structuredClone(source),id:`market-${kind}-${i+1}`,name:`Product ${i+1}`,inventory:kind==='os'?0:10000,inventoryValue:kind==='os'?undefined:source.unitCost*10000,sold:0,revenue:0,profit:0}));
 return s;
}
it('manufactures inventory then sells with positive unit economics',()=>{
 const s=released();const n=cmd(s,{type:'advance',days:7});expect(n.products[0].sold).toBeGreaterThan(0);expect(n.products[0].profit).toBeGreaterThan(0);
 expect(n.products[0].inventory).toBeGreaterThanOrEqual(0);expect(n.finance.revenue).toBe(n.products[0].revenue);
 expect(cmd(s,{type:'advance',days:180}).company.cash).toBeGreaterThan(500000);
});
it('rejects developing releases and invalid target or price',()=>{
 const s=developed();for(const c of [{type:'line',id:'p-1',target:100},{type:'price',id:'p-1',price:0},{type:'line',id:'bad',target:2}])expect(()=>cmd(s,c)).toThrow();
 const developing={...s,products:s.products.map(p=>({...p,remaining:1}))};expect(()=>cmd(developing,{type:'launch',id:'p-1'})).toThrow();
});
it('does not manufacture using nonexistent cash',()=>{
 const s=released();s.company.cash=0;const n=cmd(s,{type:'advance',days:1});expect(n.products[0].inventory).toBe(0);expect(n.company.cash).toBe(0);
});
it('sales reflect price elasticity and replay exactly after restore',()=>{
 const s=released();const expensive=cmd(s,{type:'price',id:'p-1',price:priceRange(s.products[0]).max});
 const normal=cmd(s,{type:'advance',days:70});expect(normal.products[0].sold).toBeGreaterThan(cmd(expensive,{type:'advance',days:70}).products[0].sold);
 expect(normal).toEqual(cmd(importSave(exportSave(s)),{type:'advance',days:70}));
});
it.each(['cpu','gpu','motherboard','ram','storage'])('all %s families produce valid designs',kind=>{
 const s=developed(kind);expect(s.products[0].unitCost).toBeGreaterThan(0);expect(s.products[0].performance).toBeGreaterThan(0);
});
it.each([
 ['CPU','cpu','normal','standard'],['CPU hard','cpu','hard','standard'],['CPU long','cpu','normal','long'],['OS','os','normal','standard'],
] as const)('%s clones share one bounded category demand pool',(_,kind,difficulty,mode)=>{
 const single=categoryFixture(kind,1,difficulty,mode);sellProducts(single);
 const clones=categoryFixture(kind,5,difficulty,mode);sellProducts(clones);
 const singleSales=single.products[0].sold;
 const cloneSales=clones.products.reduce((sum,p)=>sum+p.sold,0);
 expect(singleSales).toBeGreaterThan(0);
 expect(cloneSales).toBeLessThanOrEqual(Math.ceil(singleSales*1.4));
 const replay=categoryFixture(kind,5,difficulty,mode);sellProducts(replay);
 expect(replay).toEqual(clones);
});
it('allocates more of a shared category pool to the more attractive product and respects stock limits',()=>{
 const improved=categoryFixture('cpu',2);improved.products[1].performance*=1.5;improved.products[1].price=300;
 sellProducts(improved);
 expect(improved.products[1].sold).toBeGreaterThan(improved.products[0].sold);
 const stockout=categoryFixture('cpu',2);stockout.products[0].inventory=0;stockout.products[0].inventoryValue=0;sellProducts(stockout);
 const market=categoryFixture('cpu',1);sellProducts(market);
 expect(stockout.products[1].sold).toBeLessThanOrEqual(market.products[0].sold);
});

