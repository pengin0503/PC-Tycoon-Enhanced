import {it,expect} from 'vitest';
import {createGame,command} from '../packages/sim/src/index';
import {availableForRetail,availableForAI,availableForAssembly,assemblyDemand} from '../packages/sim/src/inventory-allocation';
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
 const contracted=structuredClone(s);contracted.offers=[{id:1,productId:'p-1',buyer:'契約先',quantity:20,unitPrice:20000,expiresDay:s.day+7}];contracted.offerSeq=1;
 expect(()=>command(contracted,{type:'respondOffer',id:1,action:'accept'})).toThrow(/在庫/);
 contracted.offers[0].quantity=10;
 expect(command(contracted,{type:'respondOffer',id:1,action:'accept'}).products[0].inventory).toBe(30);
});

it('reserves the next assembly batch while selling only surplus, without freezing an entire part line (#32)',()=>{
 const s=start(),part={id:'p-gpu',name:'GPU',kind:'gpu',spec:{},performance:1000,power:20,unitCost:100,price:200,remaining:0,inventory:20,target:30,line:true,launched:true,sold:0,revenue:0,profit:0,releaseDay:0,reliability:.9};
 const device={...part,id:'p-pc',name:'PC',kind:'pc',spec:{gpu:'p-gpu',cpu:'v-cpu',ram:'v-ram',motherboard:'v-board',storage:'v-storage'},inventory:2,target:8};
 s.products=[part,device] as typeof s.products;
 expect(assemblyDemand(s,s.products[0])).toBe(6);
 expect(availableForRetail(s,s.products[0])).toBe(14);
 expect(availableForAI(s,s.products[0])).toBe(14);
 s.products[0].stockAllocation={retail:5,assembly:2,ai:3};
 expect(availableForRetail(s,s.products[0])).toBe(11);
 expect(availableForAssembly(s.products[0])).toBe(12);
 expect(availableForAI(s,s.products[0])).toBe(9);
 s.products[1].line=false;
 expect(assemblyDemand(s,s.products[0])).toBe(0);
 expect(availableForRetail(s,s.products[0])).toBe(15);
});
