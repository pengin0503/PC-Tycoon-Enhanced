import {withTestStaff} from './staff-fixture';
const createGame=(...args:Parameters<typeof baseGame>)=>withTestStaff(baseGame(...args));
import {it,expect} from 'vitest';
import {techCatalog} from '../packages/content/src/tech-catalog';
import {createGame as baseGame,command,gameSchema} from '../packages/sim/src/index';
const start=()=>createGame({id:'visual-legacy',name:'デザイン社',difficulty:'normal',seed:42});
const cpu={cores:1,clock:.8,ipc:1,process:180,l1Cache:.0625,l2Cache:.125,l3Cache:.0625,cooling:40,socket:'Atlas'};
const design=(visual?:{tier:number,color:'graphite'|'silver'|'teal'})=>({type:'design',kind:'cpu',name:'C1',spec:cpu,price:40000,...(visual?{visual}:{})} as const);
it('adds 45 reachable, non-duplicated visual research milestones without replacing existing technology',()=>{
 expect(techCatalog.filter(t=>t.axis==='visual')).toHaveLength(45);
 expect(new Set(techCatalog.map(t=>t.id)).size).toBe(techCatalog.length);
 for(const cat of ['cpu','gpu','motherboard','ram','storage','monitor','psu','pc','laptop']){
  for(let level=1;level<=5;level++){
   const t=techCatalog.find(x=>x.id===cat+'-visual-'+level);
   expect(t).toBeDefined();
   expect(t!.prerequisites).toContain(level===1?cat+'-compute-1':cat+'-visual-'+(level-1));
  }
 }
});
it('blocks cosmetic level before research, retains optional old-save visual field, and charges finite finishing cost',()=>{
 let s=start();s=command(s,{type:'research',id:'cpu-compute-1'});s=command(s,{type:'advance',days:7});
 expect(()=>command(s,design({tier:1,color:'teal'}))).toThrow();
 const legacy=command(s,design());expect(gameSchema.parse(JSON.parse(JSON.stringify(legacy))).products[0].visual).toBeUndefined();
 s=command({...s,company:{...s.company,researchPoints:100}}, {type:'research',id:'cpu-visual-1'});s=command(s,{type:'advance',days:7});
 const styled=command(s,design({tier:1,color:'teal'})).products[0];
 expect(styled.visual).toEqual({tier:1,color:'teal'});
 expect(styled.unitCost).toBeGreaterThan(legacy.products[0].unitCost);
 expect(styled.performance).toBe(legacy.products[0].performance);
 expect(()=>command(s,design({tier:2,color:'teal'}))).toThrow();
 expect(()=>command(s,design({tier:1,color:'purple' as any}))).toThrow();
});
