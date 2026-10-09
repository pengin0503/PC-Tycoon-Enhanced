import {it,expect} from 'vitest';
import {createGame,command} from '../packages/sim/src/index';
import {hardwareTechYear} from '../packages/content/src/hardware';
import {marketYear} from '../packages/sim/src/market';
import {earliestResearchYear} from '../packages/content/src/era';
import {techById} from '../packages/content/src/research';
import {researchPointCost} from '../packages/sim/src/business';

/** 100-year deterministic offline smoke test. This is NOT a substitute for economy/player simulation QA. */
it('keeps 30-year and 100-year economy progression finite and auditable (#25)',()=>{
 let s=createGame({id:'century',name:'Century',difficulty:'normal',seed:73});
 s.company.cash=1_000_000_000_000;
 s=command(s,{type:'hire',role:'research',skill:50});
 const records:{year:number,tech:number,points:number,rivalLevel:number,cash:number}[]=[];
 let next=1;
 for(let year=1;year<=100;year++){
  const t=techById.get(`cpu-compute-${next}`);
  if(t&&s.company.researchPoints>=researchPointCost(s,t.id)&&marketYear(s.day)>=earliestResearchYear(t)){
   s=command(s,{type:'research',id:t.id});next++;
  }
  s=command(s,{type:'advance',days:360});
  if(year===30||year===100)records.push({
   year:marketYear(s.day),tech:hardwareTechYear('cpu',s.research.completed),
   points:s.company.researchPoints,rivalLevel:Math.max(...s.rivals.map(r=>r.researchLevel)),cash:s.company.cash,
  });
 }
 expect(records.map(x=>x.year)).toEqual([2030,2100]);
 expect(records.every(x=>Number.isFinite(x.cash)&&x.cash>=0&&x.points>=0&&x.tech>=2000&&x.rivalLevel<=50)).toBe(true);
 expect(s.marketSales.every(entry=>entry.day>=s.day-359)).toBe(true);
 expect(command(s,{type:'advance',days:0})).toEqual(s);
 console.info('LONG_HORIZON_OBSERVATIONS '+JSON.stringify(records));
},120000);
