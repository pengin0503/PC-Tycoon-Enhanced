import {it,expect} from 'vitest';
import {createGame,command} from '../packages/sim/src/index';
import {availableForRetail} from '../packages/sim/src/inventory-allocation';
import {withTestStaff} from './staff-fixture';
import {defaultSpec} from '../packages/content/src/hardware';
import {exportSave,importSave} from '../packages/save/src/index';
const start=()=>createGame({id:'alloc',name:'自社',difficulty:'normal',seed:1});
it('allows a product to split retail, assembly and AI reserved inventory while preserving legacy defaults (#32)',()=>{
 let s=withTestStaff(start());s.research.completed.push('gpu-compute-1');
 s=command(s,{type:'design',kind:'gpu',name:'GPU',spec:defaultSpec('gpu'),price:20000});
 s=command(s,{type:'advance',days:14});s=command(s,{type:'launch',id:'p-1'});
 s.products[0].inventory=40;s.products[0].inventoryValue=40*s.products[0].unitCost;
 s=command(s,{type:'allocateStock',id:'p-1',retail:5,assembly:15,ai:8});
 expect(s.products[0].stockAllocation).toEqual({retail:5,assembly:15,ai:8});
 expect(availableForRetail(s,s.products[0],40)).toBe(17);
 expect(importSave(exportSave(s)).products[0].stockAllocation).toEqual(s.products[0].stockAllocation);
 expect(()=>command(s,{type:'allocateStock',id:'p-1',retail:-1,assembly:0,ai:0})).toThrow();
});
