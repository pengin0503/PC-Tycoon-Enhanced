import {it,expect} from 'vitest';
import {createGame,command,advanceInteractive,type GameState} from '../packages/sim/src/index';
import {exportSave,importSave} from '../packages/save/src/index';
import {companyStats,yearRevenue} from '../packages/sim/src/progress';
import {researchPointCost} from '../packages/sim/src/business';
const cmd=(s:any,c:any)=>command(s,c) as GameState;
const start=(mode?:'standard'|'tycoon'|'long'|'sandbox',difficulty:'normal'|'hard'='normal')=>createGame({id:'g5',name:'進行社',year:2026,difficulty,seed:5,...(mode?{mode}:{})});
const cpu={cores:4,clock:3,ipc:1,process:14,cache:8,cooling:40,socket:'Atlas'};

it('game modes change research cost, rival speed and demand',()=>{
 expect(start().mode).toBe('standard');
 expect(researchPointCost(start('long'),'cpu-compute-1')).toBe(200);expect(researchPointCost(start('tycoon'),'cpu-compute-1')).toBe(75);
 expect(start('long').rivals[0].efficiency).toBeCloseTo(.7);expect(start('long','hard').rivals[0].efficiency).toBeCloseTo(1.05);
 const sell=(mode:'standard'|'tycoon')=>{let s=start(mode);s.research.completed.push('cpu-compute-1');s=cmd(s,{type:'design',kind:'cpu',name:'C',spec:cpu,price:400});s=cmd(s,{type:'advance',days:14});
  s=cmd(s,{type:'launch',id:'p-1'});s=cmd(s,{type:'line',id:'p-1',target:500});return cmd(s,{type:'advance',days:56}).products[0].sold;};
 expect(sell('tycoon')).toBeGreaterThan(sell('standard'));
});

it('sandbox mode allows setting resources and never earns achievements',()=>{
 expect(()=>cmd(start(),{type:'sandbox',cash:1})).toThrow();
 const s=cmd(start('sandbox'),{type:'sandbox',cash:5e10,researchPoints:9999,fans:2e6});
 expect(s.company.cash).toBe(5e10);expect(s.company.researchPoints).toBe(9999);expect(s.company.fans).toBe(2e6);expect(s.achievements).toEqual([]);
});

it('hard difficulty ends the company when monthly costs go unpaid; normal keeps the debt',()=>{
 const hard=start(undefined,'hard');hard.company.cash=100;
 const over=cmd(hard,{type:'advance',days:60});expect(over.gameOver).toMatchObject({day:30});expect(over.day).toBe(30);
 expect(()=>cmd(over,{type:'advance',days:1})).toThrow(/ゲームオーバー/);expect(advanceInteractive(over,3).day).toBe(30);
 expect(cmd(over,{type:'markNotificationsRead',id:over.notificationSeq}).notificationReadId).toBe(over.notificationSeq);
 const normal=start();normal.company.cash=100;const debt=cmd(normal,{type:'advance',days:60});expect(debt.gameOver).toBeNull();expect(debt.company.debt).toBeGreaterThan(0);
});

it('achievements unlock once with their day from stats and milestones',()=>{
 let s=start();s.research.completed.push('cpu-compute-1');s.company.cash=2_000_000;
 s=cmd(s,{type:'advance',days:1});expect(s.achievements.map(a=>a.id)).toContain('cash-1');
 s=cmd(s,{type:'design',kind:'cpu',name:'C',spec:cpu,price:400});s=cmd(s,{type:'advance',days:14});s=cmd(s,{type:'launch',id:'p-1'});
 const first=s.achievements.find(a=>a.id==='first-launch')!;expect(first.day).toBe(s.day);
 s=cmd(s,{type:'advance',days:3});expect(s.achievements.filter(a=>a.id==='first-launch')).toHaveLength(1);
 expect(s.notifications.some(n=>n.kind==='achievement')).toBe(true);
 const big=start();big.company.cash=50_000_000;let o=big;for(let level=2;level<=10;level++)o=cmd(o,{type:'office',level});expect(o.achievements.map(a=>a.id)).toContain('office-max');
});

it('company stats include yearly revenue from history',()=>{
 const s=start();s.finance.revenue=5000;s.day=400;s.history=[{day:30,cash:1,debt:0,loan:0,revenue:1000,expenses:0,capital:0,share:0}];
 expect(yearRevenue(s)).toBe(4000);expect(companyStats(s).earned).toBe(5000);
});

it('rename and logo persist; older saves default them',()=>{
 const s=cmd(cmd(start(),{type:'rename',name:'新社名'}),{type:'logo',logo:7});expect(s.company.name).toBe('新社名');expect(s.company.logo).toBe(7);
 expect(()=>cmd(s,{type:'logo',logo:24})).toThrow();expect(()=>cmd(s,{type:'rename',name:'  '})).toThrow();
 const json=JSON.parse(exportSave(s));delete json.company.logo;delete json.mode;delete json.achievements;delete json.gameOver;
 const loaded=importSave(JSON.stringify(json));expect(loaded.company.logo).toBe(0);expect(loaded.mode).toBe('standard');expect(loaded.gameOver).toBeNull();
});
