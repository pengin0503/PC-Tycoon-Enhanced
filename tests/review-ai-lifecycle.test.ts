import {it,expect} from 'vitest';
import {command,validateGame} from '../packages/sim/src';
import {exportSave,importSave} from '../packages/save/src';
import {companyValue} from '../packages/sim/src/management';
import {aiFixture,serviceConfig,modelDesign} from './review-fixture';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {AIPanel} from '../apps/web/src/AIPanel';
const cmd=(s:any,c:any)=>command(s,c);
it('AI Lab exposes a history tab separately from active models and clusters',()=>{
 const html=renderToStaticMarkup(createElement(AIPanel,{state:aiFixture(),send:()=>true}));
 expect(html).toContain('履歴');
});
it('old economic migration scales completed equipment provenance consistently',()=>{
 const raw:any=aiFixture();delete raw.economyVersion;
 const migrated=importSave(JSON.stringify(raw));
 expect(migrated.models[0].trainingCluster!.purchaseCost).toBe(migrated.clusters[0].purchaseCost);
});
it('archives a failed model at the 100-model cap and retains totals and monotonic IDs',()=>{
 let s=aiFixture();s.models=Array.from({length:100},(_,i)=>({...structuredClone(s.models[0]),id:`m-${i+1}`,status:'failed' as const}));
 s=cmd(s,{type:'archiveModel',id:'m-100'});expect(s.models).toHaveLength(99);
 expect((s as any).aiHistory.totals.models).toBe(1);expect((s as any).aiHistory.totals.trainingCost).toBe(100);
 s=cmd(s,{type:'trainModel',name:'Next',design:modelDesign,clusterId:'c-1',budget:1e9});
 expect(s.models.at(-1)!.id).toBe('m-101');expect(importSave(exportSave(s))).toEqual(s);
});
it('cannot archive training or live models and leaves input unchanged',()=>{
 const s=cmd(aiFixture(),serviceConfig),before=structuredClone(s);
 expect(()=>cmd(s,{type:'archiveModel',id:'m-1'})).toThrow(/停止/);expect(s).toEqual(before);
 const training=aiFixture();training.models[0].status='training';training.models[0].remainingSeconds=10;
 expect(()=>cmd(training,{type:'archiveModel',id:'m-1'})).toThrow(/学習中/);
});
it('disposes an idle cluster with a noncash writeoff and preserves completed model provenance',()=>{
 const s=aiFixture(),before=companyValue(s),cash=s.company.cash,expenses=s.finance.expenses;
 const n=cmd(s,{type:'disposeCluster',id:'c-1'});
 expect(n.clusters).toHaveLength(0);expect(n.company.cash).toBe(cash);expect(n.company.debt).toBe(s.company.debt);
 expect(n.finance.expenses-expenses).toBe(1e6);expect(before-companyValue(n)).toBe(1e6);
 expect((n.models[0] as any).trainingCluster.id).toBe('c-1');expect(n.products).toEqual(s.products);
 expect(()=>importSave(exportSave(n))).not.toThrow();expect(()=>cmd(n,{type:'disposeCluster',id:'c-1'})).toThrow();
});
it('refuses busy disposal, permits free publication, and can redeploy a stopped model to new equipment',()=>{
 const live=cmd(aiFixture(),serviceConfig);expect(()=>cmd(live,{type:'disposeCluster',id:'c-1'})).toThrow(/使用中/);
 const free=cmd(aiFixture(),{...serviceConfig,mode:'open'});const n=cmd(free,{type:'disposeCluster',id:'c-1'});expect(n.models[0].service!.enabled).toBe(true);
 let stopped=cmd(live,{type:'retireModel',id:'m-1'});stopped=cmd(stopped,{type:'disposeCluster',id:'c-1'});
 stopped.clusters=[{...live.clusters[0],id:'c-2'}];stopped=cmd(stopped,{...serviceConfig,clusterId:'c-2'});
 expect(stopped.models[0].service!.clusterId).toBe('c-2');expect(()=>validateGame({...live,clusters:[]})).toThrow();
});
it('keeps only 200 model details but all totals, and settles accrued fees once',()=>{
 let s=aiFixture();
 for(let i=1;i<=201;i++){s.models=[{...structuredClone(aiFixture().models[0]),id:`m-${i}`}];s=cmd(s,{type:'archiveModel',id:`m-${i}`});}
 expect((s as any).aiHistory.models).toHaveLength(200);expect((s as any).aiHistory.models[0].id).toBe('m-2');
 expect((s as any).aiHistory.totals.models).toBe(201);expect((s as any).aiHistory.totals.trainingCost).toBe(20100);
 let accrued=cmd(aiFixture(),serviceConfig);accrued.models[0].service!.enabled=false;accrued.models[0].service!.subscriptionUserDays=30;
 accrued=cmd(accrued,{type:'archiveModel',id:'m-1'});const revenue=accrued.finance.revenue;
 expect(revenue).toBeGreaterThan(0);expect(importSave(exportSave(accrued)).finance.revenue).toBe(revenue);
 expect(()=>cmd(accrued,{type:'archiveModel',id:'m-1'})).toThrow();
});
