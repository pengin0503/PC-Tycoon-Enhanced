import {it,expect} from 'vitest';
import {createGame,command,type GameState} from '../packages/sim/src/index';
import {defaultSpec,hardwareCatalog} from '../packages/content/src/hardware';
import {researchPointCost} from '../packages/sim/src/business';
import {developmentCost} from '../packages/sim/src/development-cost';
import {eraDemandFactor} from '../packages/sim/src/events';
import {productDemandForecast} from '../packages/sim/src/hardware';

const fresh=()=>createGame({id:'staff-era',name:'検証',difficulty:'normal',seed:31});
const hire=(s:GameState,role:'research'|'engineering'|'marketing'|'ai')=>command(s,{type:'hire',role,skill:50});

it('requires a research employee before unlocking technology and stops passive RP without staff',()=>{
 const s=fresh();
 expect(()=>command(s,{type:'research',id:'cpu-compute-1'})).toThrow(/研究担当/);
 expect(command(s,{type:'advance',days:7}).company.researchPoints).toBe(s.company.researchPoints);
 const researcher=hire(s,'research');
 expect(command(researcher,{type:'research',id:'cpu-compute-1'}).research.completed).toContain('cpu-compute-1');
 expect(command(researcher,{type:'advance',days:7}).company.researchPoints).toBeGreaterThan(researcher.company.researchPoints);
});

it('requires engineers for hardware design and marketing staff for launch presentations',()=>{
 const s=fresh();s.research.completed.push('cpu-compute-1');
 const price=40000,spec=defaultSpec('cpu');
 expect(()=>command(s,{type:'design',kind:'cpu',name:'A',spec,price})).toThrow(/開発担当/);
 let work=command(hire(s,'engineering'),{type:'design',kind:'cpu',name:'A',spec,price});
 work=command(work,{type:'advance',days:30});
 expect(work.products[0].remaining).toBe(0);
 expect(()=>command(work,{type:'launch',id:'p-1',presentation:'online'})).toThrow(/マーケティング担当/);
 expect(command(work,{type:'launch',id:'p-1',presentation:'none'}).products[0].launched).toBe(true);
 expect(command(hire(work,'marketing'),{type:'launch',id:'p-1',presentation:'online'}).products[0].launched).toBe(true);
});

it('gates AI staff behind transformer and makes research unlocks progressively more expensive',()=>{
 const s=fresh();
 expect(()=>hire(s,'ai')).toThrow(/Transformer/);
 const r=hire(s,'research');
 const first=researchPointCost(r,'gpu-compute-1');
 const unlocked=command(r,{type:'research',id:'cpu-compute-1'});
 expect(researchPointCost(unlocked,'gpu-compute-1')).toBeGreaterThan(first);
 const funded=command(unlocked,{type:'advance',days:35});
 const historical=structuredClone(funded);historical.day=17*360;historical.year=2017;
 const aiReady=command(historical,{type:'research',id:'ai-compute-1'});
 expect(hire(aiReady,'ai').staff.some(e=>e.role==='ai')).toBe(true);
});

it('scales one-time hardware development expense with designed performance',()=>{
 const base=hardwareCatalog.cpu.designCost;
 expect(developmentCost('cpu',4800,0,base)).toBeGreaterThan(developmentCost('cpu',1200,0,base));
 expect(developmentCost('cpu',1200,0,base)).toBeGreaterThan(0);
});

it('models era demand events and declining demand for aging products',()=>{
 expect(eraDemandFactor('pc',360)).toBeLessThan(eraDemandFactor('pc',0));
 expect(eraDemandFactor('gpu',22*360)).toBeGreaterThan(eraDemandFactor('gpu',19*360));
 const s=fresh();s.research.completed.push('cpu-compute-1');
 let v=command(hire(s,'engineering'),{type:'design',kind:'cpu',name:'A',spec:defaultSpec('cpu'),price:40000});
 v=command(v,{type:'advance',days:30});
 v=command(v,{type:'launch',id:'p-1',presentation:'none'});
 const first=productDemandForecast(v,v.products[0]);
 const aged={...v,day:v.day+1800,year:v.year+5};
 expect(productDemandForecast(aged,aged.products[0])).toBeLessThan(first);
});
