import {it,expect} from 'vitest';
import {createGame,command,advanceInteractive,type GameState} from '../packages/sim/src/index';
import {exportSave,importSave} from '../packages/save/src/index';
import {osApps} from '../packages/sim/src/devices';
import {attackDamage,osRequirements} from '../packages/sim/src/os';
const cmd=(s:any,c:any)=>command(s,c) as GameState;
const start=()=>createGame({id:'g4',name:'OS社',year:2026,difficulty:'normal',seed:21});
const os={type:'developOS',name:'Aurora',version:1,features:['files','calculator','browser'],quality:.9,compatibility:.9,support:.8,price:50};
const unlock=(s:GameState,...ids:string[])=>{s.research.completed.push(...ids);return s;};

it('extra OS features need their research, raise appeal and requirements, and add apps',()=>{
 const s=unlock(start(),'os-compute-1');
 expect(()=>cmd(s,{...os,features:['files','security']})).toThrow(/研究/);
 const r=unlock(start(),'os-compute-1','os-reliability-1','os-capacity-1','os-compatibility-1','os-compute-2');
 const basic=cmd(r,os).products[0];
 const rich=cmd(r,{...os,features:['files','calculator','browser','security','media','games','store'],lockScreen:'nebula',theme:'violet'}).products[0];
 expect(rich.performance).toBeGreaterThan(basic.performance);
 expect(osRequirements(rich).ram).toBeGreaterThan(osRequirements(basic).ram);
 expect(rich.spec.lockScreen).toBe('nebula');expect(rich.spec.theme).toBe('violet');expect(basic.spec.lockScreen).toBe('aurora');
 const ready={...rich,remaining:0};expect(osApps(ready)).toEqual(expect.arrayContaining(['security','media','games','store']));
 expect(()=>cmd(r,{...os,lockScreen:'void'})).toThrow();
});

function withOS(){let s=cmd(unlock(start(),'os-compute-1'),os);s=cmd(s,{type:'advance',days:21});return cmd(s,{type:'launch',id:'p-1'});}

it('hacker attacks arrive for launched OSes, pause interactive time and damage by unblocked share',()=>{
 let s=withOS();let found:GameState|undefined;
 for(let i=0;i<720&&!found;i++){s=cmd(s,{type:'advance',days:1});if(s.pendingAttack)found=s;}
 expect(found).toBeDefined();const a=found!;
 expect(a.notifications.some(n=>n.kind==='hackerAttack')).toBe(true);
 expect(advanceInteractive(a,5).day).toBe(a.day);
 a.company.fans=10000;
 const perfect=cmd(a,{type:'defendAttack',blocked:a.pendingAttack!.targets});
 const none=cmd(a,{type:'defendAttack',blocked:0});
 expect(perfect.pendingAttack).toBeNull();expect(perfect.company.reputation).toBe(a.company.reputation);expect(perfect.osIncident).toBeNull();
 expect(none.company.reputation).toBeLessThan(a.company.reputation);expect(none.company.fans).toBeLessThan(10000);expect(none.osIncident!.demand).toBeLessThan(1);
 expect(()=>cmd(a,{type:'defendAttack',blocked:99})).toThrow();expect(()=>cmd(perfect,{type:'defendAttack',blocked:1})).toThrow();
 const ignored=cmd(a,{type:'advance',days:8});expect(ignored.pendingAttack).toBeNull();expect(ignored.company.reputation).toBeLessThan(a.company.reputation);
 expect(cmd(none,{type:'advance',days:31}).osIncident).toBeNull();
});

it('security feature and support quality reduce attack damage',()=>{
 const plain={spec:{features:'files',support:0}} as any,secure={spec:{features:'files,security',support:0}} as any,supported={spec:{features:'files',support:1}} as any;
 expect(attackDamage(plain,0,12)).toBe(1);expect(attackDamage(secure,0,12)).toBeLessThan(1);expect(attackDamage(supported,0,12)).toBeLessThan(1);
 expect(attackDamage(plain,6,12)).toBeCloseTo(.5);expect(attackDamage(plain,12,12)).toBe(0);
});

it('pending attacks survive save round trips and old saves default to none',()=>{
 const s=withOS();s.pendingAttack={osId:'p-1',day:s.day,deadlineDay:s.day+7,targets:12};
 expect(importSave(exportSave(s)).pendingAttack).toEqual(s.pendingAttack);
 const json=JSON.parse(exportSave(s));delete json.pendingAttack;delete json.osIncident;expect(importSave(JSON.stringify(json)).pendingAttack).toBeNull();
 const broken=JSON.parse(exportSave(s));broken.pendingAttack.osId='p-404';expect(()=>importSave(JSON.stringify(broken))).toThrow();
});
