import {it,expect} from 'vitest';
import {createGame,command} from '../packages/sim/src/index';
import {withTestStaff} from './staff-fixture';
import {defaultSpec} from '../packages/content/src/hardware';
import {marketShare} from '../packages/sim/src/rivals';
import {importSave,exportSave} from '../packages/save/src/index';

const start=()=>createGame({id:'daily-economy',name:'販売テスト',difficulty:'normal',seed:17});

it('competing firms cover additional component markets and expand legacy three-rival saves without changing existing firms',()=>{
 const s=start();
 expect(s.rivals.length).toBeGreaterThanOrEqual(8);
 expect(new Set(s.rivals.map(r=>r.focus))).toEqual(new Set(['cpu','gpu','ram','motherboard','storage','psu','monitor']));
 const legacy=structuredClone(s);legacy.rivals=legacy.rivals.slice(0,3);
 const restored=importSave(exportSave(legacy));
 expect(restored.rivals).toHaveLength(9);
 expect(restored.rivals.slice(0,3)).toEqual(legacy.rivals);
});

it('a stocked launched product can sell on the next day rather than waiting for a weekly tick',()=>{
 let s=withTestStaff(start());s.research.completed.push('cpu-compute-1');
 s=command(s,{type:'design',kind:'cpu',name:'Daily',spec:defaultSpec('cpu'),price:30000});
 s=command(s,{type:'advance',days:14});s=command(s,{type:'launch',id:'p-1'});
 s.products[0].inventory=10000;s.products[0].inventoryValue=s.products[0].unitCost*10000;
 expect(s.day%7).toBe(0);
 const next=command(s,{type:'advance',days:1});
 expect(next.day%7).not.toBe(0);
 expect(next.products[0].sold).toBeGreaterThan(s.products[0].sold);
 expect(next.finance.revenue).toBeGreaterThan(s.finance.revenue);
 expect(command(s,{type:'advance',days:7})).toEqual(command(importSave(exportSave(s)),{type:'advance',days:7}));
});

it('rival sales also advance daily once stock and a finished design exist',()=>{
 const s=command(start(),{type:'advance',days:98});
 const r=s.rivals.find(r=>!r.acquired&&r.products.some(p=>p.remaining===0));
 expect(r).toBeDefined();
 const stock=r!.products.find(p=>p.remaining===0)!;
 stock.inventory=10000;
 const next=command(s,{type:'advance',days:1});
 const after=next.rivals.find(x=>x.id===r!.id)!.products.find(p=>p.id===stock.id)!;
 expect(after.sold).toBeGreaterThan(stock.sold);
});

it('company share is a numeric fraction of cumulative units sold',()=>{
 const s=start();const p={id:'sample',name:'Sample',kind:'cpu',spec:defaultSpec('cpu'),performance:1000,power:30,unitCost:100,remaining:0,reliability:.9,price:200,inventory:0,target:0,line:false,launched:true,sold:80,revenue:16000,profit:8000,releaseDay:0};
 s.products.push(p as any);s.rivals[0].products.push({...p,id:'competing',sold:20} as any);
 expect(marketShare(s)).toBeCloseTo(.8);
});

it('research never requires a calendar date, but still requires staff, prerequisites and RP',()=>{
 const s=withTestStaff(start());s.company.researchPoints=100000;
 const cpu=command(s,{type:'research',id:'cpu-compute-1'});
 expect(command(cpu,{type:'research',id:'cpu-capacity-1'}).research.completed).toContain('cpu-capacity-1');
 expect(command(cpu,{type:'research',id:'ai-compute-1'}).research.completed).toContain('ai-compute-1');
 expect(()=>command(s,{type:'research',id:'cpu-capacity-1'})).toThrow(/前提研究/);
 expect(()=>command(s,{type:'research',id:'ai-architecture-2'})).toThrow(/前提研究/);
 const withoutRP=structuredClone(cpu);withoutRP.company.researchPoints=0;
 expect(()=>command(withoutRP,{type:'research',id:'cpu-capacity-1'})).toThrow(/研究ポイント/);
});

it('small GPU production lines still make daily retail sales before AI research is unlocked',()=>{
 let s=withTestStaff(start());
 s.research.completed.push('gpu-compute-1');
 s=command(s,{type:'design',kind:'gpu',name:'Entry GPU',spec:defaultSpec('gpu'),price:20000});
 s=command(s,{type:'advance',days:14});
 s=command(s,{type:'launch',id:'p-1'});
 s.products[0].inventory=4;
 s.products[0].inventoryValue=4*s.products[0].unitCost;
 s.products[0].target=4;
 s.products[0].line=true;
 s.company.awareness=100;
 s.company.reputation=100;
 const next=command(s,{type:'advance',days:1});
 expect(next.products[0].sold).toBeGreaterThan(0);
});
