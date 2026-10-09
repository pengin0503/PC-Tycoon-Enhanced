import {it,expect} from 'vitest';
import {createGame,command,type GameState} from '../packages/sim/src/index';
import {exportSave,importSave} from '../packages/save/src/index';
import {reviewDemandFactor,fanDemandFactor,starsFor} from '../packages/sim/src/reception';
import {benchmarkDevice} from '../packages/sim/src/benchmark';
import {osRequirements} from '../packages/sim/src/os';
import {presentations} from '../packages/content/src/market';
import {evaluateHardware} from '../packages/sim/src/hardware';
import {frontierSpec} from './research-helpers';
const cmd=(s:any,c:any)=>command(s,c) as GameState;
const start=(seed=3)=>createGame({id:'g1',name:'評判社',difficulty:'normal',seed});
const unlock=(s:GameState,...ids:string[])=>{s.research.completed.push(...ids);return s;};
/** Year-2000 default CPU. */
const cpu={cores:1,clock:.8,ipc:1,process:180,cache:.25,cooling:40,socket:'Atlas'};
const parts={cpu:'v-cpu',gpu:'v-gpu',motherboard:'v-board',ram:'v-ram',storage:'v-storage'};
function developed(spec=cpu,price=40000){
 let s=unlock(start(),'cpu-compute-1');s=cmd(s,{type:'design',kind:'cpu',name:'C',spec,price});return cmd(s,{type:'advance',days:14});
}

it('launch publishes a deterministic review with stars and outlet comments',()=>{
 const s=developed();
 const a=cmd(s,{type:'launch',id:'p-1'}),b=cmd(s,{type:'launch',id:'p-1'});
 const review=a.products[0].review!;expect(review).toEqual(b.products[0].review);
 expect(review.stars).toBeGreaterThanOrEqual(1);expect(review.stars).toBeLessThanOrEqual(5);expect(review.stars%0.5).toBe(0);
 expect(review.outlets).toHaveLength(4);expect(review.outlets.every(o=>o.comment.length>0)).toBe(true);
 expect(a.notifications.some(n=>n.kind==='reviewPublished')).toBe(true);
 expect(s.products[0].review).toBeUndefined();
});

it('stronger and cheaper products review better; overpricing hurts value',()=>{
 const weak=cmd(developed({...cpu,clock:.6}),{type:'launch',id:'p-1'}).products[0].review!;
 const strong=cmd(developed({...cpu,clock:1},90000),{type:'launch',id:'p-1'}).products[0].review!;
 expect(strong.axes.performance).toBeGreaterThan(weak.axes.performance);
 const fair=cmd(developed(cpu,34000),{type:'launch',id:'p-1'}).products[0].review!;
 const greedy=cmd(developed(cpu,90000),{type:'launch',id:'p-1'}).products[0].review!;
 expect(greedy.axes.value).toBeLessThan(fair.axes.value);expect(greedy.score).toBeLessThan(fair.score);
});

it('innovation compares against the company\'s previous model of the same kind',()=>{
 let s=unlock(start(),'cpu-compute-1');
 s=cmd(s,{type:'design',kind:'cpu',name:'A',spec:cpu,price:40000});s=cmd(s,{type:'design',kind:'cpu',name:'B',spec:{...cpu,clock:1},price:60000});s=cmd(s,{type:'design',kind:'cpu',name:'C',spec:{...cpu,clock:.6},price:30000});
 s=cmd(s,{type:'advance',days:70});s=cmd(s,{type:'launch',id:'p-1'});
 expect(cmd(s,{type:'launch',id:'p-2'}).products[1].review!.axes.innovation).toBeGreaterThan(cmd(s,{type:'launch',id:'p-3'}).products[2].review!.axes.innovation);
});

it('presentations cost cash, add decaying hype and win more fans',()=>{
 const s=developed();
 const plain=cmd(s,{type:'launch',id:'p-1',presentation:'none'});
 const show=cmd(s,{type:'launch',id:'p-1',presentation:'keynote'});
 expect(s.company.cash-show.company.cash).toBe(presentations.keynote.cost);expect(plain.company.cash).toBe(s.company.cash);
 expect(show.products[0].hype).toBe(presentations.keynote.hype);expect(plain.products[0].hype).toBeUndefined();
 expect(show.company.fans).toBeGreaterThan(plain.company.fans);expect(show.company.awareness).toBeGreaterThan(plain.company.awareness);
 let later=show;for(let i=0;i<30;i++)later=cmd(later,{type:'advance',days:7});expect(later.products[0].hype).toBeUndefined();
 const poor=developed();poor.company.cash=100;expect(()=>cmd(poor,{type:'launch',id:'p-1',presentation:'keynote'})).toThrow();
});

it('fans grow with sales and advertising, decay, and give a bounded demand bonus',()=>{
 let s=cmd(developed(),{type:'launch',id:'p-1'});s=cmd(s,{type:'line',id:'p-1',target:200});
 const launched=s.company.fans;s=cmd(s,{type:'advance',days:28});expect(s.company.fans).toBeGreaterThan(0);
 const ad=cmd(cmd(s,{type:'marketing',budget:1000000}),{type:'advance',days:7});const quiet=cmd(s,{type:'advance',days:7});
 expect(ad.company.fans).toBeGreaterThan(quiet.company.fans);expect(launched).toBeGreaterThan(0);
 const crowd=start();crowd.company.fans=1e11;expect(fanDemandFactor(crowd)).toBe(1.4);expect(fanDemandFactor(start())).toBe(1);
 expect(reviewDemandFactor({review:undefined})).toBe(1);
 expect(reviewDemandFactor({review:{score:90} as any})).toBeGreaterThan(reviewDemandFactor({review:{score:40} as any}));
 expect(starsFor(0)).toBe(1);expect(starsFor(100)).toBe(5);expect(starsFor(73)).toBe(3.5);
});

it('device benchmarks report component scores and fictional game FPS',()=>{
 let s=unlock(start(),'pc-compute-1','laptop-compute-1','gpu-compute-1');
 const big=frontierSpec('gpu',s.research.completed);
 s=cmd(s,{type:'design',kind:'gpu',name:'Big',spec:big,price:evaluateHardware('gpu',big,s.research.completed).unitCost*2});s=cmd(s,{type:'advance',days:14});
 const build=(kind:'pc'|'laptop',gpu:string)=>({type:'assemble',kind,name:'R',parts:{...parts,gpu},purpose:'gaming',appearance:'graphite',price:150000,cooling:kind==='pc'?150:80});
 s=cmd(s,build('pc','v-gpu'));s=cmd(s,build('pc','p-1'));s=cmd(s,build('laptop','p-1'));
 const [base,fast,laptop]=s.products.slice(1).map(p=>benchmarkDevice(s,p));
 expect(fast.gpu).toBeGreaterThan(base.gpu);expect(fast.games[0].fps.high).toBeGreaterThan(base.games[0].fps.high);
 expect(laptop.games[0].fps.high).toBeLessThan(fast.games[0].fps.high);
 for(const g of fast.games){expect(g.fps.low).toBeGreaterThanOrEqual(g.fps.high);expect(g.fps.high).toBeGreaterThanOrEqual(g.fps.ultra);}
 expect(()=>benchmarkDevice(s,s.products[0])).toThrow();
});

it('bundling an OS whose requirements the PC misses lowers performance',()=>{
 let s=unlock(start(),'pc-compute-1','os-compute-1','ram-compute-1');
 s=cmd(s,{type:'developOS',name:'Aurora',version:1,features:['files','calculator','browser'],quality:.8,compatibility:.8,support:.7,price:5000});
 s=cmd(s,{type:'design',kind:'ram',name:'Tiny',spec:{memoryGen:'SDR',capacity:.064,speed:133},price:6000});
 s=cmd(s,{type:'advance',days:42});s=cmd(s,{type:'launch',id:'p-1'});
 expect(osRequirements(s.products[0]).ram).toBeGreaterThan(.064);
 const build=(name:string,ram:string,osId?:string)=>cmd(s,{type:'assemble',kind:'pc',name,parts:{...parts,ram},purpose:'office',appearance:'graphite',price:300000,...(osId?{osId}:{})}).products.at(-1)!;
 const ratio=(ram:string)=>build('A',ram,'p-1').performance/build('B',ram).performance;
 expect(ratio('p-2')).toBeLessThan(ratio('v-ram')*.8);
 const tight=build('T','p-2','p-1');expect(benchmarkDevice(s,tight).osPenalty).toBe(true);
 expect(benchmarkDevice(s,build('O','v-ram','p-1')).osPenalty).toBe(false);
});

it('saves without fans, reviews or hype load unchanged',()=>{
 const s=cmd(developed(),{type:'launch',id:'p-1',presentation:'online'});
 const json=JSON.parse(exportSave(s));delete json.company.fans;delete json.products[0].review;delete json.products[0].hype;
 const loaded=importSave(JSON.stringify(json));expect(loaded.company.fans).toBe(0);expect(loaded.products[0].review).toBeUndefined();
 expect(importSave(exportSave(s)).products[0].review).toEqual(s.products[0].review);
});
