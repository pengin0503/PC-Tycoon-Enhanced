import {withTestStaff} from './staff-fixture';
import {it,expect} from 'vitest';
import {createGame,command,advanceInteractive,awaitingPlayer,type GameState} from '../packages/sim/src/index';
import {exportSave,importSave} from '../packages/save/src/index';
import {evaluateHardware} from '../packages/sim/src/hardware';
import {companyValue,loanCap} from '../packages/sim/src/management';
import {valuation,rivalFans} from '../packages/sim/src/rivals';
import {softScore,reviewDemandFactor,starsFor} from '../packages/sim/src/reception';
import {defaultSpec,hardwareCatalog} from '../packages/content/src/hardware';
import {managementBalance} from '../packages/content/src/management';
import {researchTo,frontierSpec} from './research-helpers';

const cmd=(s:any,c:any)=>command(s,c) as GameState;
const start=(difficulty:'normal'|'hard'='normal')=>withTestStaff(createGame({id:'bf',name:'検証社',difficulty,seed:11}));
const cpu={cores:1,clock:.8,ipc:1,process:180,l1Cache:.0625,l2Cache:.125,l3Cache:.0625,cooling:40,socket:'Atlas'};
const researched=(kind:'cpu'|'gpu',share:number)=>researchTo({research:{completed:[] as string[]}},kind,share).research.completed;
/** The best design of a research level that its own cooler can cool (units/cores halved until it fits). */
function frontier(kind:'cpu'|'gpu',share:number){
 const completed=researched(kind,share);const spec=frontierSpec(kind,completed);const count=kind==='cpu'?'cores':'units';
 while(evaluateHardware(kind,spec,completed,{stored:true}).power>Number(spec.cooling)&&Number(spec[count])>1)spec[count]=Number(spec[count])/2;
 return {spec,completed,result:evaluateHardware(kind,spec,completed,{stored:true})};
}
function stocked(){
 let s=start();s.research.completed.push('cpu-compute-1');s=cmd(s,{type:'design',kind:'cpu',name:'C',spec:cpu,price:60000});
 s=cmd(s,{type:'advance',days:14});s=cmd(s,{type:'launch',id:'p-1'});s=cmd(s,{type:'line',id:'p-1',target:300});
 return cmd(s,{type:'advance',days:6});
}

it('frontier designs cost more as technology advances while the same specification gets cheaper',()=>{
 for(const kind of ['cpu','gpu'] as const){
  const costs=[0,.25,.5,1].map(share=>frontier(kind,share).result.unitCost);
  for(let i=1;i<costs.length;i++)expect(costs[i],`${kind} ${costs}`).toBeGreaterThan(costs[i-1]);
  expect(costs[1]/costs[0]).toBeGreaterThan(1.5);
  const base={...defaultSpec(kind)};
  const early=evaluateHardware(kind,base,researched(kind,0),{stored:true}).unitCost,late=evaluateHardware(kind,base,researched(kind,1),{stored:true}).unitCost;
  expect(late).toBeLessThan(early);
 }
});

it('late-game frontier power stays within the coolers research provides (hundreds of watts, not tens of kilowatts)',()=>{
 for(const kind of ['cpu','gpu'] as const)for(const share of [.25,.5,1]){
  const {spec,result}=frontier(kind,share);
  expect(result.power,`${kind} ${share}`).toBeLessThanOrEqual(Number(spec.cooling));
  expect(result.power).toBeLessThan(Number(hardwareCatalog[kind].fields.cooling.max));
 }
 // The full-research GPU keeps most of its units: power no longer forces the design down to a handful.
 const gpu=frontier('gpu',1);expect(Number(gpu.spec.units)).toBeGreaterThanOrEqual(4096);expect(gpu.result.power).toBeLessThan(1000);
});

it('a discontinued product stops production and offers, clears its stock and stays out of new designs',()=>{
 let s=stocked();s.offerSeq=1;s.offers=[{id:1,productId:'p-1',buyer:'Helix 物流',quantity:10,unitPrice:50000,expiresDay:s.day+14}];
 const stock=s.products[0].inventory;expect(stock).toBeGreaterThan(0);
 const ended=cmd(s,{type:'discontinue',id:'p-1'});const p=ended.products[0];
 expect(p.discontinuedDay).toBe(s.day);expect(p.line).toBe(false);expect(p.target).toBe(0);expect(ended.offers).toEqual([]);
 expect(p.inventory).toBe(0);expect(p.sold).toBe(s.products[0].sold+stock);
 // Remaining stock is cleared at half price.
 expect(p.revenue-s.products[0].revenue).toBe(stock*30000);
 expect(()=>cmd(ended,{type:'line',id:'p-1',target:10})).toThrow();
 expect(()=>cmd(ended,{type:'discontinue',id:'p-1'})).toThrow();
 const later=cmd(ended,{type:'advance',days:30});expect(later.products[0].sold).toBe(p.sold);
 expect(importSave(exportSave(later)).products[0].discontinuedDay).toBe(s.day);
 const pc=cmd(ended,{type:'research',id:'pc-compute-1'});
 expect(()=>cmd(pc,{type:'assemble',kind:'pc',name:'Rig',parts:{cpu:'p-1',gpu:'v-gpu',motherboard:'v-board',ram:'v-ram',storage:'v-storage'},purpose:'gaming',appearance:'graphite',price:300000})).toThrow(/販売終了/);
});

it('a bulk-deal offer stops interactive time until the player answers it',()=>{
 const s=stocked();expect(awaitingPlayer(s)).toBe(false);
 s.offerSeq=1;s.offers=[{id:1,productId:'p-1',buyer:'Helix 物流',quantity:10,unitPrice:50000,expiresDay:s.day+2}];
 expect(awaitingPlayer(s)).toBe(true);
 const held=advanceInteractive(s,30);expect(held.day).toBe(s.day);expect(held.offers).toHaveLength(1);
 const answered=cmd(s,{type:'respondOffer',id:1,action:'decline'});expect(awaitingPlayer(answered)).toBe(false);
 expect(advanceInteractive(answered,3).day).toBe(s.day+3);
});

it('the borrowing limit grows with company value and never with the loan itself',()=>{
 const s=start();expect(loanCap(s)).toBe(Math.max(managementBalance.normalLoanCap,Math.floor(companyValue(s)*managementBalance.normalLoanValueShare/1e6)*1e6));
 const rich=start();rich.company.cash=20_000_000_000;expect(loanCap(rich)).toBe(Math.floor(companyValue(rich)*managementBalance.normalLoanValueShare/1e6)*1e6);expect(loanCap(rich)).toBeGreaterThan(managementBalance.normalLoanCap);
 expect(loanCap(rich)).toBeGreaterThan(loanCap(s));
 const borrowed=cmd(rich,{type:'borrow',amount:1_000_000_000});expect(loanCap(borrowed)).toBe(loanCap(rich));
 expect(()=>cmd(rich,{type:'borrow',amount:loanCap(rich)+1_000_000})).toThrow(/上限/);
 const hard=start('hard');hard.company.cash=20_000_000_000;expect(loanCap(hard)).toBe(Math.floor(companyValue(hard)*managementBalance.hardLoanValueShare/1e6)*1e6);
});

it('acquiring a rival brings its whole fan base, and rival fan bases grow with sales',()=>{
 let s=start();s.company.cash=100_000_000_000;
 const initial=rivalFans(s.rivals[0]);expect(initial).toBeGreaterThan(0);
 s=cmd(s,{type:'advance',days:120});const grown=rivalFans(s.rivals[0]);
 const fans=s.company.fans;
 const bought=cmd(s,{type:'acquire',id:'r-1',offer:valuation(s,'r-1')});
 expect(bought.rivals[0].acquired).toBe(true);
 expect(bought.company.fans).toBe(fans+Math.floor(grown));expect(rivalFans(bought.rivals[0])).toBe(0);
 expect(bought.events.some(e=>/ファン.*獲得/.test(e.detail))).toBe(true);
 // Older saves without rival fans receive the starting fan base on load.
 const json=JSON.parse(exportSave(start()));for(const r of json.rivals)delete r.fans;json.economyVersion=3;
 expect(rivalFans(importSave(JSON.stringify(json)).rivals[0])).toBe(initial);
});

it('review scores keep rising above 100 with diminishing returns, and stars stay at most five',()=>{
 expect(softScore(80)).toBe(80);expect(softScore(100)).toBe(100);
 expect(softScore(150)).toBeGreaterThan(100);expect(softScore(300)).toBeGreaterThan(softScore(150));
 expect(softScore(300)-softScore(200)).toBeLessThan(softScore(200)-softScore(100));
 expect(starsFor(160)).toBe(5);
 expect(reviewDemandFactor({review:{score:140} as any})).toBeGreaterThan(reviewDemandFactor({review:{score:100} as any}));
 // A product far ahead of its market reviews above 100 and the score survives a save round trip.
 let s=start();researchTo(s,'cpu',.3);s.company.cash=10_000_000_000;
 const spec=frontier('cpu',.3).spec;
 s=cmd(s,{type:'design',kind:'cpu',name:'Ahead',spec,price:Math.round(evaluateHardware('cpu',spec,s.research.completed).unitCost*1.2)});
 s=cmd(s,{type:'advance',days:60});s=cmd(s,{type:'launch',id:'p-1'});
 const score=s.products[0].review!.score;expect(score).toBeGreaterThan(100);
 expect(importSave(exportSave(s)).products[0].review!.score).toBe(score);
});

it('merged specifications are split into separate design fields like real products',()=>{
 const mb=['motherboard-compute-1'];const board=defaultSpec('motherboard');
 const score=(spec:Record<string,unknown>)=>evaluateHardware('motherboard',spec as any,mb,{stored:true}).performance;
 for(const key of ['usb','storagePorts','lan'])expect(score({...board,[key]:Number(board[key])*2}),key).toBeGreaterThan(score(board));
 const st=['storage-compute-1'];const disk=defaultSpec('storage');
 expect(disk.writeSpeed).toBeLessThan(Number(disk.speed));
 expect(evaluateHardware('storage',{...disk,writeSpeed:40},st,{stored:true}).performance).toBeGreaterThan(evaluateHardware('storage',disk,st,{stored:true}).performance);
 const mon=['monitor-compute-1'];const screen=defaultSpec('monitor');const view=(spec:Record<string,unknown>)=>evaluateHardware('monitor',spec as any,mon,{stored:true}).performance;
 expect(view({...screen,size:21})).toBeGreaterThan(view(screen));expect(view({...screen,brightness:300})).toBeGreaterThan(view(screen));
 expect(view({...screen,response:16})).toBeGreaterThan(view(screen));expect(view({...screen,panel:'IPS'})).toBeGreaterThan(view(screen));
 // Panels follow their own research: IPS (2004) is locked at the start.
 expect(()=>evaluateHardware('monitor',{...screen,panel:'IPS'},mon)).toThrow(/研究が必要/);
 // Saves made before the split keep their merged fields and metrics.
 const {usb:_u,storagePorts:_p,lan:_l,...rest}=board;
 expect(score({...rest,features:2})).toBeGreaterThan(0);
 const {writeSpeed:_w,...oldDisk}=disk;
 expect(evaluateHardware('storage',oldDisk,st,{stored:true}).performance).toBeGreaterThan(0);
 expect(()=>evaluateHardware('motherboard',{...rest,features:2},mb)).toThrow(/旧データ専用/);
});

it('saves before per-specification research keep their researched ranges under the new branch ids',()=>{
 const s=start();s.research.completed=['cpu-compute-1'];
 const json=JSON.parse(exportSave(s));json.economyVersion=3;
 json.research.completed=['cpu-compute-1',...Array.from({length:10},(_,i)=>`cpu-capacity-${i+1}`),'cpu-compute-2','cpu-compute-3','cpu-visual-1','os-compute-1','os-reliability-1'];
 json.research.active=[{id:'cpu-capacity-11',remaining:3}];
 const loaded=importSave(JSON.stringify(json));
 expect(loaded.economyVersion).toBe(4);
 const done=loaded.research.completed;
 // Capacity used to widen cores and L3 cache: both branches receive the same ten stages.
 expect(done).toContain('cpu-cores-10');expect(done).not.toContain('cpu-cores-11');expect(done).toContain('cpu-l3Cache-10');
 expect(done).toContain('cpu-compute-1');expect(done).toContain('cpu-visual-1');expect(done).toContain('os-security-1');
 expect(done.every(id=>/^[a-z]+-[A-Za-z0-9]+-\d+$/.test(id))).toBe(true);expect(loaded.research.active).toEqual([]);
 expect(importSave(exportSave(loaded)).research.completed).toEqual(done);
});
