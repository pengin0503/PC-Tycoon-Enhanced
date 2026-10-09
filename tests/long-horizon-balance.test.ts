import {it,expect} from 'vitest';
import {createGame,command} from '../packages/sim/src/index';
import {hardwareTechYear} from '../packages/content/src/hardware';
import {marketYear} from '../packages/sim/src/market';
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
  if(t&&s.company.researchPoints>=researchPointCost(s,t.id)){
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

/** 30-year policy comparison with actual research staff, normal starting capital, valid prerequisite chains and RP spending. */
it('quantifies research progression with one vs three researchers over 30 years (#25)',()=>{
 const profiles=[] as {researchers:number,year:number,technology:number,gap:number,spent:number,remaining:number,cash:number,levels:number}[];
 for(const researchers of [1,3]){
  let s=createGame({id:`staff-policy-${researchers}`,name:'研究比較',difficulty:'normal',seed:83});
  for(let i=0;i<researchers;i++)s=command(s,{type:'hire',role:'research',skill:60});
  let spent=0;
  for(let year=1;year<=30;year++){
   for(let attempt=0;attempt<150;attempt++){
    const next=['compute','capacity','power','compatibility'].flatMap(axis=>{
     const completed=s.research.completed.filter(x=>x.startsWith(`cpu-${axis}-`)).length;
     const tech=techById.get(`cpu-${axis}-${completed+1}`);
     return tech&&tech.prerequisites.every(id=>s.research.completed.includes(id))?[tech]:[];
    }).sort((a,b)=>researchPointCost(s,a.id)-researchPointCost(s,b.id)||a.id.localeCompare(b.id))[0];
    if(!next)break;
    const cost=researchPointCost(s,next.id);if(cost>s.company.researchPoints)break;
    s=command(s,{type:'research',id:next.id});spent+=cost;
   }
   s=command(s,{type:'advance',days:360});
  }
  const technology=hardwareTechYear('cpu',s.research.completed),year=marketYear(s.day);
  profiles.push({researchers,year,technology,gap:Number((technology-year).toFixed(1)),spent,remaining:s.company.researchPoints,cash:s.company.cash,levels:s.research.completed.filter(x=>x.startsWith('cpu-')).length});
 }
 expect(profiles.every(p=>p.year===2030&&p.cash>=0&&Number.isFinite(p.gap))).toBe(true);
 expect(profiles[1].technology).toBeGreaterThan(profiles[0].technology);
 expect(profiles[1].levels).toBeGreaterThan(profiles[0].levels);
 console.info('RESEARCH_POLICY_COMPARISON '+JSON.stringify(profiles));
},120000);
