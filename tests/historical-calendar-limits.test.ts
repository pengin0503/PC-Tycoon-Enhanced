import {it,expect} from 'vitest';
import {createGame,command} from '../packages/sim/src/index';
import {fieldRange,fieldOptions,defaultSpec} from '../packages/content/src/hardware';
import {withTestStaff} from './staff-fixture';
it('historical consumer hardware ceilings apply to new designs but preserve old saved products (#33)',()=>{
 const completed=Array.from({length:10},(_,i)=>`cpu-capacity-${i+1}`).concat(['cpu-compute-1','cpu-compute-2']);
 expect(fieldRange('cpu','cores',completed,2000).max).toBe(1);
 expect(fieldRange('cpu','cores',completed,2005).max).toBe(2);
 expect(fieldRange('cpu','cores',completed,2008).max).toBeGreaterThanOrEqual(2);
 expect(fieldRange('cpu','clock',completed,2000).max).toBeLessThanOrEqual(1.5);
 const early=withTestStaff(createGame({id:'cap',name:'年代',difficulty:'normal',seed:7}));
 early.research.completed=[...completed,...Array.from({length:10},(_,i)=>`cpu-compute-${i+3}`)];
 expect(()=>command(early,{type:'design',kind:'cpu',name:'Impossible',spec:{...defaultSpec('cpu'),cores:2},price:50000})).toThrow(/現在の研究|年代/);
 expect(fieldRange('gpu','vram',['gpu-compute-1','gpu-capacity-1'],2000).max).toBeLessThanOrEqual(.064);
 expect(fieldOptions('ram','memoryGen',['ram-compute-1','ram-compatibility-1'],2000)).not.toContain('DDR5');
});
