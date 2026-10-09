import {it,expect} from 'vitest';
import {createGame,command,type GameState} from '../packages/sim/src/index';
import {exportSave,importSave} from '../packages/save/src/index';
import {researchPointCost,acquisitionChance,offerSuccessChance,distributionCost,salaryFor,traitWorkMultiplier} from '../packages/sim/src/business';
import {valuation} from '../packages/sim/src/rivals';
import {monthlyCosts} from '../packages/sim/src/management';
import {derivedRandom} from '../packages/sim/src/random';
const cmd=(s:any,c:any)=>command(s,c) as GameState;
const start=(difficulty:'normal'|'hard'='normal',seed=11)=>createGame({id:'g3',name:'経営社',difficulty,seed});
/** Year-2000 default CPU. */
const cpu={cores:1,clock:.8,ipc:1,process:180,cache:.25,cooling:40,socket:'Atlas'};

it('research point costs scale with level and difficulty; points accrue weekly with staff and office',()=>{
 const s=start();expect(researchPointCost(s,'cpu-compute-1')).toBe(100);
 expect(researchPointCost(s,'cpu-compute-10')).toBeGreaterThan(researchPointCost(s,'cpu-compute-2'));
 expect(researchPointCost(start('hard'),'cpu-compute-1')).toBe(130);
 const base=cmd(s,{type:'advance',days:7}).company.researchPoints-s.company.researchPoints;
 const staffed=cmd(cmd(s,{type:'hire',role:'research',skill:80}),{type:'advance',days:7});
 expect(staffed.company.researchPoints-s.company.researchPoints).toBeGreaterThan(base);
 const office=start();office.company.cash=1_000_000_000;const big=cmd(office,{type:'office',level:2});
 expect(cmd(big,{type:'advance',days:7}).company.researchPoints).toBeGreaterThan(cmd(office,{type:'advance',days:7}).company.researchPoints);
});

it('legacy in-progress research still completes from saved work',()=>{
 const s=start();const json=JSON.parse(exportSave(s));json.research.active=[{id:'cpu-compute-1',remaining:5}];delete json.company.researchPoints;
 const loaded=importSave(JSON.stringify(json));expect(loaded.company.researchPoints).toBe(0);
 expect(cmd(loaded,{type:'advance',days:7}).research.completed).toContain('cpu-compute-1');
});

it('distribution network raises demand and fans at a monthly cost',()=>{
 let s=start();s.company.cash=1_000_000_000;
 expect(()=>cmd(s,{type:'distribution',level:2})).toThrow();
 const d=cmd(s,{type:'distribution',level:1});expect(s.company.cash-d.company.cash).toBe(distributionCost(1));
 expect(monthlyCosts(d)).toBeGreaterThan(monthlyCosts(s));
 expect(cmd(d,{type:'advance',days:7}).company.fans).toBeGreaterThan(cmd(s,{type:'advance',days:7}).company.fans);
 const poor=start();poor.company.cash=0;expect(()=>cmd(poor,{type:'distribution',level:1})).toThrow();
});

function stocked(){
 let s=start();s.research.completed.push('cpu-compute-1');s=cmd(s,{type:'design',kind:'cpu',name:'C',spec:cpu,price:60000});
 s=cmd(s,{type:'advance',days:14});s=cmd(s,{type:'launch',id:'p-1'});s=cmd(s,{type:'line',id:'p-1',target:300});
 s=cmd(s,{type:'advance',days:6});return s;
}
const withOffer=(s:GameState,quantity=10)=>{s.offerSeq=1;s.offers=[{id:1,productId:'p-1',buyer:'Helix 物流',quantity,unitPrice:50000,expiresDay:s.day+14}];return s;};
function bundledOffer({price=280000,osPrice=5000,includeOS=true}:{price?:number,osPrice?:number,includeOS?:boolean}={}){
 let s=start();s.research.completed.push('os-compute-1','pc-compute-1');
 s=cmd(s,{type:'developOS',name:'Aurora',version:1,features:['files','calculator','browser'],quality:.8,compatibility:.8,support:.7,price:5000});
 s=cmd(s,{type:'advance',days:14});s=cmd(s,{type:'launch',id:'p-1'});
 s=cmd(s,{type:'assemble',kind:'pc',name:'Bundle',parts:{cpu:'v-cpu',gpu:'v-gpu',motherboard:'v-board',ram:'v-ram',storage:'v-storage'},purpose:'office',appearance:'silver',price:300000,...(includeOS?{osId:'p-1'}:{})});
 s=cmd(s,{type:'advance',days:14});s=cmd(s,{type:'launch',id:'p-2'});
 const pc=s.products.find(p=>p.id==='p-2')!;pc.inventory=2;pc.inventoryValue=180000;
 s.products.find(p=>p.id==='p-1')!.price=osPrice;
 s.offerSeq=1;s.offers=[{id:1,productId:'p-2',buyer:'大型法人',quantity:2,unitPrice:price,expiresDay:s.day+14}];
 return s;
}

it('bulk offers can be accepted, declined or countered with markup-dependent odds',()=>{
 const s=withOffer(stocked());const inv=s.products[0].inventory;
 const ok=cmd(s,{type:'respondOffer',id:1,action:'accept'});
 expect(ok.products[0].inventory).toBe(inv-10);expect(ok.company.cash-s.company.cash).toBe(500000);expect(ok.offers).toEqual([]);
 const no=cmd(s,{type:'respondOffer',id:1,action:'decline'});expect(no.company.cash).toBe(s.company.cash);expect(no.offers).toEqual([]);
 const sure=cmd(s,{type:'respondOffer',id:1,action:'counter',markup:1});expect(sure.company.cash).toBeGreaterThan(ok.company.cash-1);
 const greedy=cmd(s,{type:'respondOffer',id:1,action:'counter',markup:30});expect(greedy.company.cash).toBe(s.company.cash);expect(greedy.offers).toEqual([]);
 expect(offerSuccessChance(0)).toBe(1);expect(offerSuccessChance(25)).toBe(0);expect(offerSuccessChance(10)).toBeCloseTo(.6);
 expect(()=>cmd(withOffer(stocked(),1_000),{type:'respondOffer',id:1,action:'accept'})).toThrow(/在庫/);
 expect(()=>cmd(s,{type:'respondOffer',id:9,action:'accept'})).toThrow();
});
it('bulk PC sales split bundled OS revenue and consume weighted inventory cost exactly once',()=>{
 const s=bundledOffer();const pc=s.products.find(p=>p.id==='p-2')!;const os=s.products.find(p=>p.id==='p-1')!;
 const before={cash:s.company.cash,pcRevenue:pc.revenue,pcProfit:pc.profit,osSold:os.sold,osRevenue:os.revenue,osProfit:os.profit,osCost:os.unitCost};
 const sold=cmd(s,{type:'respondOffer',id:1,action:'accept'});
 const soldPC=sold.products.find(p=>p.id==='p-2')!;const soldOS=sold.products.find(p=>p.id==='p-1')!;
 expect(sold.company.cash-before.cash).toBe(560000);
 expect(soldPC.revenue-before.pcRevenue).toBe(550000);
 expect(soldOS.sold-before.osSold).toBe(2);
 expect(soldOS.revenue-before.osRevenue).toBe(10000);
 expect((soldPC.profit-before.pcProfit)+(soldOS.profit-before.osProfit)).toBe(560000-180000);
 expect(soldPC.inventory).toBe(0);expect(soldPC.inventoryValue).toBe(0);

 const highLicense=bundledOffer({osPrice:400000});
 const highLicenseOSRevenue=highLicense.products.find(p=>p.id==='p-1')!.revenue;
 const highSold=cmd(highLicense,{type:'respondOffer',id:1,action:'accept'});
 expect(highSold.products.find(p=>p.id==='p-2')!.revenue).toBe(0);
 expect(highSold.products.find(p=>p.id==='p-1')!.revenue-highLicenseOSRevenue).toBe(560000);
 const plain=bundledOffer({includeOS:false});
 const plainOSSold=plain.products.find(p=>p.id==='p-1')!.sold;
 const plainSold=cmd(plain,{type:'respondOffer',id:1,action:'accept'});
 expect(plainSold.products.find(p=>p.id==='p-2')!.revenue).toBe(560000);
 expect(plainSold.products.find(p=>p.id==='p-1')!.sold).toBe(plainOSSold);

 const counter=bundledOffer();let seed=1;
 while(derivedRandom(seed,counter.day,7001)>=offerSuccessChance(1))seed++;
 counter.initialSeed=seed;
 const countered=cmd(counter,{type:'respondOffer',id:1,action:'counter',markup:1});
 expect(countered.company.cash-counter.company.cash).toBe(2*Math.round(280000*1.01));
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
 let s=start();expect(s.candidates).toHaveLength(3);s.company.cash=1_000_000_000;
 const k=s.candidates[0];const hired=cmd(s,{type:'hireCandidate',id:k.id});
 expect(hired.staff[0]).toMatchObject({role:k.role,skill:k.skill});expect(hired.candidates).toHaveLength(2);
 const premium=cmd(s,{type:'searchCandidates',tier:'premium'});expect(s.company.cash-premium.company.cash).toBe(2000000);
 expect(premium.candidates.every(c=>c.skill>=70&&c.trait)).toBe(true);
 const month=cmd(s,{type:'advance',days:30});expect(month.candidates.map(c=>c.id)).not.toEqual(s.candidates.map(c=>c.id));
 expect(salaryFor(50,'frugal')).toBe(120000);expect(salaryFor(50)).toBe(150000);
 expect(traitWorkMultiplier('genius','research')).toBe(1.5);expect(traitWorkMultiplier('ai-specialist','ai')).toBe(1.5);expect(traitWorkMultiplier(undefined,'ai')).toBe(1);
 const g=start();g.staff=[{id:'e-1',role:'research',skill:60,salary:180000,trait:'genius'}];g.staffSeq=1;
 const n=start();n.staff=[{id:'e-1',role:'research',skill:60,salary:180000}];n.staffSeq=1;
 expect(cmd(g,{type:'advance',days:7}).company.researchPoints).toBeGreaterThan(cmd(n,{type:'advance',days:7}).company.researchPoints);
});

it('firing pays severance and never reuses staff ids',()=>{
 let s=start();s=cmd(s,{type:'hire',role:'research',skill:50});s=cmd(s,{type:'hire',role:'engineering',skill:50});
 const fired=cmd(s,{type:'fire',id:'e-2'});expect(s.company.cash-fired.company.cash).toBe(150000*3);expect(fired.staff.map(e=>e.id)).toEqual(['e-1']);
 const again=cmd(fired,{type:'hire',role:'marketing',skill:40});expect(again.staff.map(e=>e.id)).toEqual(['e-1','e-3']);
 expect(()=>cmd(s,{type:'fire',id:'e-9'})).toThrow();
});

