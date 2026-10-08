import {it,expect} from 'vitest';
import {createGame,command,type GameState} from '../packages/sim/src/index';
import {exportSave,importSave} from '../packages/save/src/index';
import {researchPointCost,acquisitionChance,offerSuccessChance,distributionCost,salaryFor,traitWorkMultiplier} from '../packages/sim/src/business';
import {valuation} from '../packages/sim/src/rivals';
import {monthlyCosts} from '../packages/sim/src/management';
const cmd=(s:any,c:any)=>command(s,c) as GameState;
const start=(difficulty:'normal'|'hard'='normal',seed=11)=>createGame({id:'g3',name:'経営社',year:2026,difficulty,seed});
const cpu={cores:4,clock:3,ipc:1,process:14,cache:8,socket:'Atlas'};

it('research point costs scale with level and difficulty; points accrue weekly with staff and office',()=>{
 const s=start();expect(researchPointCost(s,'cpu-compute-1')).toBe(100);
 expect(researchPointCost(s,'cpu-compute-10')).toBeGreaterThan(researchPointCost(s,'cpu-compute-2'));
 expect(researchPointCost(start('hard'),'cpu-compute-1')).toBe(130);
 const base=cmd(s,{type:'advance',days:7}).company.researchPoints-s.company.researchPoints;
 const staffed=cmd(cmd(s,{type:'hire',role:'research',skill:80}),{type:'advance',days:7});
 expect(staffed.company.researchPoints-s.company.researchPoints).toBeGreaterThan(base);
 const office=start();office.company.cash=10_000_000;const big=cmd(office,{type:'office',level:2});
 expect(cmd(big,{type:'advance',days:7}).company.researchPoints).toBeGreaterThan(cmd(office,{type:'advance',days:7}).company.researchPoints);
});

it('legacy in-progress research still completes from saved work',()=>{
 const s=start();const json=JSON.parse(exportSave(s));json.research.active=[{id:'cpu-compute-1',remaining:5}];delete json.company.researchPoints;
 const loaded=importSave(JSON.stringify(json));expect(loaded.company.researchPoints).toBe(0);
 expect(cmd(loaded,{type:'advance',days:7}).research.completed).toContain('cpu-compute-1');
});

it('distribution network raises demand and fans at a monthly cost',()=>{
 let s=start();s.company.cash=10_000_000;
 expect(()=>cmd(s,{type:'distribution',level:2})).toThrow();
 const d=cmd(s,{type:'distribution',level:1});expect(s.company.cash-d.company.cash).toBe(distributionCost(1));
 expect(monthlyCosts(d)).toBeGreaterThan(monthlyCosts(s));
 expect(cmd(d,{type:'advance',days:7}).company.fans).toBeGreaterThan(cmd(s,{type:'advance',days:7}).company.fans);
 const poor=start();poor.company.cash=0;expect(()=>cmd(poor,{type:'distribution',level:1})).toThrow();
});

function stocked(){
 let s=start();s.research.completed.push('cpu-compute-1');s=cmd(s,{type:'design',kind:'cpu',name:'C',spec:cpu,price:900});
 s=cmd(s,{type:'advance',days:14});s=cmd(s,{type:'launch',id:'p-1'});s=cmd(s,{type:'line',id:'p-1',target:300});
 s=cmd(s,{type:'advance',days:6});return s;
}
const withOffer=(s:GameState,quantity=10)=>{s.offerSeq=1;s.offers=[{id:1,productId:'p-1',buyer:'Helix 物流',quantity,unitPrice:800,expiresDay:s.day+14}];return s;};

it('bulk offers can be accepted, declined or countered with markup-dependent odds',()=>{
 const s=withOffer(stocked());const inv=s.products[0].inventory;
 const ok=cmd(s,{type:'respondOffer',id:1,action:'accept'});
 expect(ok.products[0].inventory).toBe(inv-10);expect(ok.company.cash-s.company.cash).toBe(8000);expect(ok.offers).toEqual([]);
 const no=cmd(s,{type:'respondOffer',id:1,action:'decline'});expect(no.company.cash).toBe(s.company.cash);expect(no.offers).toEqual([]);
 const sure=cmd(s,{type:'respondOffer',id:1,action:'counter',markup:1});expect(sure.company.cash).toBeGreaterThan(ok.company.cash-1);
 const greedy=cmd(s,{type:'respondOffer',id:1,action:'counter',markup:30});expect(greedy.company.cash).toBe(s.company.cash);expect(greedy.offers).toEqual([]);
 expect(offerSuccessChance(0)).toBe(1);expect(offerSuccessChance(25)).toBe(0);expect(offerSuccessChance(10)).toBeCloseTo(.6);
 expect(()=>cmd(withOffer(stocked(),1_000),{type:'respondOffer',id:1,action:'accept'})).toThrow(/在庫/);
 expect(()=>cmd(s,{type:'respondOffer',id:9,action:'accept'})).toThrow();
});

it('offers arrive monthly for stocked products and expire',()=>{
 let s=stocked();let seen=false;
 for(let i=0;i<12&&!seen;i++){s=cmd(s,{type:'advance',days:30});seen=s.events.some(e=>e.kind==='offerReceived');}
 expect(seen).toBe(true);
 const t=withOffer(stocked());t.offers[0].expiresDay=t.day+1;expect(cmd(t,{type:'advance',days:1}).offers).toEqual([]);
});

it('acquisition offers below valuation succeed with rising odds and impose a cooldown on refusal',()=>{
 expect(acquisitionChance(70,100)).toBeCloseTo(.1);expect(acquisitionChance(100,100)).toBe(1);expect(acquisitionChance(69,100)).toBe(0);
 expect(acquisitionChance(85,100)).toBeGreaterThan(acquisitionChance(75,100));
 const s=start();s.company.cash=100_000_000;const value=valuation(s,'r-1');
 expect(()=>cmd(s,{type:'acquire',id:'r-1',offer:Math.floor(value*.5)})).toThrow();
 const full=cmd(s,{type:'acquire',id:'r-1',offer:value});expect(full.rivals[0].acquired).toBe(true);
 // find a seed/day where a 70% bid is refused, then confirm the cooldown
 let probe=s,refused:GameState|undefined;
 for(let i=0;i<40&&!refused;i++){const r=cmd(probe,{type:'acquire',id:'r-1',offer:Math.ceil(valuation(probe,'r-1')*.7)});if(!r.rivals[0].acquired)refused=r;else probe=cmd(probe,{type:'advance',days:1});}
 expect(refused).toBeDefined();expect(refused!.rivals[0].negotiationDay).toBe(refused!.day+30);
 expect(()=>cmd(refused!,{type:'acquire',id:'r-1',offer:valuation(refused!,'r-1')})).toThrow(/再交渉/);
 expect(refused!.company.cash).toBe(probe.company.cash);
 const legacy=cmd(s,{type:'acquire',id:'r-2'});expect(legacy.rivals[1].acquired).toBe(true);
});

it('candidates refresh monthly, paid searches find stronger talent, traits change work and pay',()=>{
 let s=start();expect(s.candidates).toHaveLength(3);s.company.cash=10_000_000;
 const k=s.candidates[0];const hired=cmd(s,{type:'hireCandidate',id:k.id});
 expect(hired.staff[0]).toMatchObject({role:k.role,skill:k.skill});expect(hired.candidates).toHaveLength(2);
 const premium=cmd(s,{type:'searchCandidates',tier:'premium'});expect(s.company.cash-premium.company.cash).toBe(20000);
 expect(premium.candidates.every(c=>c.skill>=70&&c.trait)).toBe(true);
 const month=cmd(s,{type:'advance',days:30});expect(month.candidates.map(c=>c.id)).not.toEqual(s.candidates.map(c=>c.id));
 expect(salaryFor(50,'frugal')).toBe(1200);expect(salaryFor(50)).toBe(1500);
 expect(traitWorkMultiplier('genius','research')).toBe(1.5);expect(traitWorkMultiplier('ai-specialist','ai')).toBe(1.5);expect(traitWorkMultiplier(undefined,'ai')).toBe(1);
 const g=start();g.staff=[{id:'e-1',role:'research',skill:60,salary:1800,trait:'genius'}];g.staffSeq=1;
 const n=start();n.staff=[{id:'e-1',role:'research',skill:60,salary:1800}];n.staffSeq=1;
 expect(cmd(g,{type:'advance',days:7}).company.researchPoints).toBeGreaterThan(cmd(n,{type:'advance',days:7}).company.researchPoints);
});

it('firing pays severance and never reuses staff ids',()=>{
 let s=start();s=cmd(s,{type:'hire',role:'research',skill:50});s=cmd(s,{type:'hire',role:'engineering',skill:50});
 const fired=cmd(s,{type:'fire',id:'e-2'});expect(s.company.cash-fired.company.cash).toBe(1500*3);expect(fired.staff.map(e=>e.id)).toEqual(['e-1']);
 const again=cmd(fired,{type:'hire',role:'marketing',skill:40});expect(again.staff.map(e=>e.id)).toEqual(['e-1','e-3']);
 expect(()=>cmd(s,{type:'fire',id:'e-9'})).toThrow();
});
