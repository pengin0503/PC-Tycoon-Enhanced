import {it,expect} from 'vitest';
import {withTestStaff} from './staff-fixture';
import {createGame,command,type GameState} from '../packages/sim/src/index';
import {researchPointCost} from '../packages/sim/src/business';
import {evaluateHardware} from '../packages/sim/src/hardware';
import {defaultSpec,fieldRange} from '../packages/content/src/hardware';
import {branchPlan,researchRecommendations,researchLink,researchLinkFilter} from '../apps/web/src/research-plan';
import {unlockBranch} from './research-helpers';

function lab(points=1_000_000){
 const s=withTestStaff(createGame({id:'rs',name:'研究社',difficulty:'normal',seed:9}));
 s.research.completed.push('cpu-compute-1');s.company.researchPoints=points;s.company.cash=10_000_000_000;
 return s;
}
const stageCosts=(s:GameState,n:number)=>{
 const copy=structuredClone(s),costs:number[]=[];
 for(let i=1;i<=n;i++){costs.push(researchPointCost(copy,`cpu-cores-${i}`));copy.research.completed.push(`cpu-cores-${i}`);}
 return costs;
};

it('researching several stages of a branch at once pays each stage and fails as a whole (#42)',()=>{
 const s=lab(),costs=stageCosts(s,3);
 const after=command(s,{type:'researchBranch',category:'cpu',axis:'cores',stages:3});
 expect(['cpu-cores-1','cpu-cores-2','cpu-cores-3'].every(id=>after.research.completed.includes(id))).toBe(true);
 expect(after.research.completed).not.toContain('cpu-cores-4');
 expect(s.company.researchPoints-after.company.researchPoints).toBe(costs.reduce((a,b)=>a+b,0));
 // Points for only two stages: nothing is researched and nothing is paid.
 const poor=lab(costs[0]+costs[1]);
 expect(()=>command(poor,{type:'researchBranch',category:'cpu',axis:'cores',stages:3})).toThrow(/研究ポイントが不足/);
 expect(poor.research.completed).not.toContain('cpu-cores-1');expect(poor.company.researchPoints).toBe(costs[0]+costs[1]);
 // A finished branch cannot go further.
 const done=unlockBranch(lab(),'cpu','cores',100);
 expect(()=>command(done,{type:'researchBranch',category:'cpu',axis:'cores',stages:1})).toThrow(/最後の段階/);
});

it('the research plan counts the stages the company can pay for, and the simulation accepts exactly that plan',()=>{
 const costs=stageCosts(lab(),5),s=lab(costs.slice(0,4).reduce((a,b)=>a+b,0)+1);
 const plan=branchPlan(s,'cpu','cores');
 expect(plan.stages).toBe(4);expect(plan.cost).toBe(costs.slice(0,4).reduce((a,b)=>a+b,0));expect(plan.next!.id).toBe('cpu-cores-1');
 const after=command(s,{type:'researchBranch',category:'cpu',axis:'cores',stages:plan.stages});
 expect(after.company.researchPoints).toBe(1);
 expect(branchPlan(after,'cpu','cores')).toMatchObject({stages:0,cost:0,next:{id:'cpu-cores-5'}});
 // Without a researcher nothing can be planned.
 const alone=createGame({id:'a',name:'一人社',difficulty:'normal',seed:1});alone.company.researchPoints=1e9;
 expect(branchPlan(alone,'cpu','cores').stages).toBe(0);
});

it('recommends the branches whose limits the newest design already uses, and links the development screen to them',()=>{
 let s=unlockBranch(lab(),'cpu','l2Cache',2);
 expect(researchRecommendations(s)).toEqual([]);
 const spec={...defaultSpec('cpu'),l2Cache:fieldRange('cpu','l2Cache',s.research.completed).max};
 const metrics=evaluateHardware('cpu',spec,s.research.completed);
 s=command(s,{type:'design',kind:'cpu',name:'Max',spec,price:metrics.unitCost*2});
 // The default spec already sits at several year-2000 limits, so ask for every recommendation.
 const recommended=researchRecommendations(s,20);
 expect(recommended.map(r=>`${r.category}/${r.axis}`)).toContain('cpu/l2Cache');
 expect(recommended.find(r=>r.axis==='l2Cache')!.reason).toContain('Max');
 // A fully researched branch is never recommended.
 unlockBranch(s,'cpu','l2Cache',100);
 expect(researchRecommendations(s,20).map(r=>r.axis)).not.toContain('l2Cache');
 const link=researchLink('cpu','memoryChannels');
 expect(link).toBe('#/research?category=cpu&axis=memoryChannels');
 expect(researchLinkFilter(link)).toEqual({category:'cpu',axis:'memoryChannels'});
 expect(researchLinkFilter('#/research')).toEqual({category:'',axis:''});
});
