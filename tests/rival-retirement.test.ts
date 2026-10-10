import {it,expect} from 'vitest';
import {withTestStaff} from './staff-fixture';
import {createGame,command,type GameState} from '../packages/sim/src/index';
import {exportSave,importSave} from '../packages/save/src/index';
import {rivalMonthly,rivalWeekly,rivalDaily,competitorPressure,rivalOnSale,retirementNotice} from '../packages/sim/src/rivals';
import {currentUnitCost} from '../packages/sim/src/hardware';
import {discontinueHint} from '../apps/web/src/sales-stats';
import {rivalBalance} from '../packages/content/src/management';
import {hardwareBalance,defaultSpec} from '../packages/content/src/hardware';

const start=()=>withTestStaff(createGame({id:'ret',name:'競合観察社',difficulty:'normal',seed:21}));
/** Lets every rival launch one model per level from 1 to `levels` (time is set directly; no retail involved). */
function generations(s:GameState,levels:number){
 for(const r of s.rivals)r.cash=1e13;
 for(let level=1;level<=levels;level++){
  for(const r of s.rivals){r.researchLevel=level;r.researchRemaining=0;}
  s.day+=30;rivalMonthly(s);
  for(let w=0;w<3;w++){s.day+=7;rivalWeekly(s);}
  for(const r of s.rivals)for(const p of r.products)if(rivalOnSale(p))p.inventory=100;
 }
 return s;
}

it('rivals keep only their newest models on sale and clear the stock of retired ones (#41)',()=>{
 const s=generations(start(),8);
 for(const r of s.rivals){
  expect(r.products).toHaveLength(8);
  const active=r.products.filter(p=>p.discontinuedDay===undefined);
  expect(active.map(p=>p.spec.generation)).toEqual([6,7,8]);
  for(const p of r.products.filter(p=>p.discontinuedDay!==undefined)){
   expect(p.inventory).toBe(0);expect(p.line).toBe(false);expect(rivalOnSale(p)).toBe(false);
  }
 }
 // Retiring clears 100 units at the clearance price.
 const r=s.rivals[0],retired=r.products[0];
 expect(retired.sold).toBe(100);expect(retired.revenue).toBe(100*Math.max(1,Math.round(retired.price*hardwareBalance.clearanceShare)));
 // Retired models neither sell, nor count as competing supply.
 const before=r.products.map(p=>p.sold);
 retired.inventory=50;rivalDaily(s);expect(retired.sold).toBe(before[0]);retired.inventory=0;
 const pressure=competitorPressure(s,'cpu');
 for(const p of r.products.filter(p=>!rivalOnSale(p)))p.inventory=999;
 expect(competitorPressure(s,'cpu')).toBe(pressure);
 expect(rivalBalance.activeModels).toBe(3);
});

it('a player PC that uses a retired rival part gets a notice, and acquisitions take only the current line-up',()=>{
 let s=generations(start(),2);s.research.completed.push('pc-compute-1');s.company.cash=1e13;
 const rival=s.rivals[0],part=rival.products[0];
 s=command(s,{type:'assemble',kind:'pc',name:'Rival Inside',parts:{cpu:part.id,gpu:'v-gpu',motherboard:'v-board',ram:'v-ram',storage:'v-storage'},purpose:'office',appearance:'silver',price:300000,cooling:150});
 s=command(s,{type:'advance',days:28});s=command(s,{type:'launch',id:s.products.at(-1)!.id});
 s=generations(s,4);
 expect(s.notifications.some(n=>n.kind==='rivalDiscontinued'&&n.detail.includes('Rival Inside')&&n.detail.includes(part.name))).toBe(true);
 const owned=s.products.length;rival.cash=0;s.company.debt=0;s.company.cash=1e14;
 s=command(s,{type:'acquire',id:rival.id});
 expect(s.products.length-owned).toBe(3);
 expect(s.products.slice(owned).every(p=>p.discontinuedDay===undefined)).toBe(true);
});

it('economy version 4 saves retire old rival models on load',()=>{
 const s=start();
 for(const r of s.rivals)r.cash=1e13;
 // Build an old-style line-up: eight models, none retired.
 for(let level=1;level<=8;level++)for(const r of s.rivals)r.products.push({...structuredClone(r.products.at(-1)??{id:'x',name:'x',kind:r.focus,spec:{generation:0},performance:1000,power:10,unitCost:10000,remaining:0,reliability:.9,price:20000,inventory:0,target:1000,line:true,launched:true,sold:0,revenue:0,profit:0,releaseDay:0}),id:`${r.id}-p-${level}`,name:`${r.name} ${level}`,spec:{generation:level},inventory:40});
 const json=JSON.parse(exportSave(s));json.economyVersion=4;
 for(const r of json.rivals)for(const p of r.products)delete p.discontinuedDay;
 const loaded=importSave(JSON.stringify(json));
 expect(loaded.economyVersion).toBe(5);
 for(const r of loaded.rivals){
  expect(r.products.filter(p=>p.discontinuedDay===undefined).map(p=>p.spec.generation)).toEqual([6,7,8]);
  expect(r.products.filter(p=>p.discontinuedDay!==undefined).every(p=>p.inventory===0&&p.sold===40)).toBe(true);
 }
 // Products that have sold get a last-sale date at the migration, so they are not flagged as unsold for 90 days.
 let seller=start();seller.research.completed.push('cpu-compute-1');
 seller=command(seller,{type:'design',kind:'cpu',name:'Old',spec:defaultSpec('cpu'),price:40000});seller=command(seller,{type:'advance',days:35});
 const sold=JSON.parse(exportSave(seller));sold.economyVersion=4;sold.products[0].sold=500;
 const migrated=importSave(JSON.stringify(sold));
 expect(migrated.products[0].lastSaleDay).toBe(migrated.day);
});

it('a rival retires its oldest model only once the replacement is released',()=>{
 const s=generations(start(),3),r=s.rivals[0];
 expect(r.products.filter(rivalOnSale)).toHaveLength(3);
 for(const x of s.rivals){x.researchLevel=4;x.researchRemaining=0;}
 s.day+=30;rivalMonthly(s);
 // The new model is still in development: the three released ones stay on sale.
 expect(r.products).toHaveLength(4);expect(r.products.at(-1)!.remaining).toBeGreaterThan(0);
 expect(r.products.filter(rivalOnSale).map(p=>p.spec.generation)).toEqual([1,2,3]);
 for(let w=0;w<3;w++){s.day+=7;rivalWeekly(s);}
 expect(r.products.filter(rivalOnSale).map(p=>p.spec.generation)).toEqual([2,3,4]);
 expect(r.products[0].discontinuedDay).toBeDefined();
});

it('retirement notices stay within the notification length limit',()=>{
 const names=Array.from({length:12},(_,i)=>`とても長い名前のゲーミングPCシリーズ ${i+1} 限定モデル`);
 const text=retirementNotice('Vertex Works Vertex Works 12',names);
 expect(text.length).toBeLessThanOrEqual(200);expect(text).toContain(names[0]);expect(text).toMatch(/ほか\d+件/);
 expect(retirementNotice('A',['PC1','PC2'])).toBe('A（使用中: PC1、PC2）');
 expect(retirementNotice('A'.repeat(300),['PC']).length).toBeLessThanOrEqual(200);
});

it('margins of a PC with rival parts follow the rival price manufacturing pays now',()=>{
 let s=generations(start(),1);s.research.completed.push('pc-compute-1');s.company.cash=1e13;
 const part=s.rivals[0].products[0];
 s=command(s,{type:'assemble',kind:'pc',name:'Rival Inside',parts:{cpu:part.id,gpu:'v-gpu',motherboard:'v-board',ram:'v-ram',storage:'v-storage'},purpose:'office',appearance:'silver',price:300000,cooling:150});
 const pc=s.products.at(-1)!,before=currentUnitCost(s,pc);
 s.rivals[0].products[0].price+=50000;
 expect(currentUnitCost(s,pc)-before).toBe(50000);
 expect(discontinueHint(s.day,{...pc,launched:true,price:before+1},currentUnitCost(s,pc))).toBe('原価割れ');
 // Components keep their design-time cost.
 expect(currentUnitCost(s,part as never)).toBe(part.unitCost);
});
