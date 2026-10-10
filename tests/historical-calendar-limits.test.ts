import {it,expect} from 'vitest';
import {createGame,command} from '../packages/sim/src/index';
import {fieldRange,fieldOptions,defaultSpec} from '../packages/content/src/hardware';
import {withTestStaff} from './staff-fixture';
import {typicalSpec} from '../packages/sim/src/market';
import {shareAtYear} from '../packages/content/src/era';
import {hardwarePerformance} from '../packages/sim/src/hardware';
import {importSave,exportSave} from '../packages/save/src/index';

it('player hardware capability follows research, not a mandatory historical year (#33)',()=>{
 const untouched=['cpu-compute-1'];
 expect(fieldRange('cpu','cores',untouched).max).toBe(1);
 const progressed=[...untouched,'cpu-cores-1','cpu-cores-2','cpu-cores-3','cpu-cooling-1','cpu-cooling-2','cpu-cooling-3'];
 expect(fieldRange('cpu','cores',progressed).max).toBeGreaterThan(1);
 const year2000=withTestStaff(createGame({id:'cap',name:'研究社',difficulty:'normal',seed:7}));
 year2000.company.cash=10_000_000_000;
 year2000.research.completed=progressed;
 const spec={...defaultSpec('cpu'),cores:2,cooling:80};
 const designed=command(year2000,{type:'design',kind:'cpu',name:'Advanced',spec,price:50000});
 expect(designed.products[0].spec.cores).toBe(2);
 expect(designed.year).toBe(2000);
 expect(importSave(exportSave(designed)).products[0].spec.cores).toBe(2);
});
it('DDR generation depends on memory-generation research rather than world calendar',()=>{
 const advanced=Array.from({length:25},(_,i)=>`ram-memoryGen-${i+1}`).concat('ram-compute-1');
 expect(fieldOptions('ram','memoryGen',['ram-compute-1'])).not.toContain('DDR5');
 expect(fieldOptions('ram','memoryGen',advanced)).toContain('DDR5');
 expect(fieldRange('gpu','vram',['gpu-compute-1']).max).toBeLessThan(fieldRange('gpu','vram',['gpu-compute-1','gpu-vram-1']).max);
});

it('performance balancing follows a researched frontier while a typical 2025 competitor uses desktop-scale targets (#33)',()=>{
 const old=typicalSpec('cpu',shareAtYear(2000));
 const modern=typicalSpec('cpu',shareAtYear(2025));
 expect(old.cores).toBe(1);
 expect(Number(modern.cores)).toBeGreaterThan(Number(old.cores));
 expect(Number(modern.cores)).toBeLessThanOrEqual(16);
 expect(hardwarePerformance('cpu',modern)).toBeGreaterThan(hardwarePerformance('cpu',old));
 const mainstreamGpu=typicalSpec('gpu',shareAtYear(2025));
 expect(Number(mainstreamGpu.vram)).toBeLessThanOrEqual(16);
 expect(Number(mainstreamGpu.vram)).toBeGreaterThan(.032);
 // Market curves inform rivals and customers, but never deny a player an early high-end design.
 const completed=Array.from({length:40},(_,i)=>`cpu-cores-${i+1}`).concat('cpu-compute-1');
 expect(fieldRange('cpu','cores',completed).max).toBeGreaterThan(16);
});
