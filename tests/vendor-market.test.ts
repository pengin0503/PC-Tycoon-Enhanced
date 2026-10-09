import {it,expect} from 'vitest';
import {createGame,command} from '../packages/sim/src/index';
import {vendorParts} from '../packages/content/src/devices';
import {vendorPartsAt,findVendorPart} from '../packages/sim/src/vendor-market';
import {findPart,evaluateDevice} from '../packages/sim/src/devices';
import {withTestStaff} from './staff-fixture';

it('uses 2000-era vendors and adds stable year-specific parts as technology progresses (#24)',()=>{
 expect(vendorPartsAt(0).map(x=>x.id)).toEqual(vendorParts.map(x=>x.id));
 const later=vendorPartsAt(10*360);
 const cpu=later.find(x=>x.id==='v-2010-cpu')!;
 expect(cpu).toBeDefined();
 expect(cpu.performance).toBeGreaterThan(vendorParts.find(x=>x.id==='v-cpu')!.performance);
 expect(findVendorPart('v-2010-cpu')).toEqual(cpu);
 expect(vendorPartsAt(20*360).find(x=>x.id==='v-2010-cpu')).toBeUndefined();
 const save=createGame({id:'vendor',name:'メーカー',difficulty:'normal',seed:7});
 expect(findPart({...save,day:20*360},cpu.id)).toEqual(cpu);
 expect(findPart(save,'v-cpu')).toEqual(vendorParts.find(x=>x.id==='v-cpu'));
});
it('modern vendor motherboard and RAM remain generationally compatible (#24)',()=>{
 const s=withTestStaff(createGame({id:'vendor-build',name:'メーカー',difficulty:'normal',seed:7}));
 s.day=15*360;s.year=2015;s.research.completed.push('pc-compute-1');
 const current=vendorPartsAt(s.day);
 const ids=Object.fromEntries(['cpu','gpu','motherboard','ram','storage','psu'].map(kind=>[kind,current.find(p=>p.kind===kind)!.id]));
 const cpu=findPart(s,ids.cpu),board=findPart(s,ids.motherboard),ram=findPart(s,ids.ram);
 expect(cpu?.spec.socket).toBe(board?.spec.socket);
 expect(ram?.spec.memoryGen).toBe(board?.spec.memoryGen);
 expect(()=>evaluateDevice(s,ids,'office','pc',undefined,false,2000)).not.toThrow();
});
