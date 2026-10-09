import {it,expect} from 'vitest';
import {createGame,command} from '../packages/sim/src/index';
import {exportSave,importSave} from '../packages/save/src/index';
import {migrateEconomy} from '../packages/sim/src/migrate';
import {marketReference,typicalSpec} from '../packages/sim/src/market';
import {techYear,eraBalance} from '../packages/content/src/era';
import {hardwareTechYear,fieldOptions,fieldRange} from '../packages/content/src/hardware';
import {productCatalog} from '../packages/content/src/devices';
import {domainTechYear} from '../apps/web/src/research-hints';
import {researchTo,frontierSpec} from './research-helpers';
const start=()=>createGame({id:'era',name:'年代社',difficulty:'normal',seed:2});

it('games start on 1 January 2000 with year-2000 technology',()=>{
 const s=start();expect(s.year).toBe(2000);expect(s.day).toBe(0);expect(s.economyVersion).toBe(2);
 expect(hardwareTechYear('cpu',[])).toBe(2000);expect(domainTechYear('pc',[])).toBe(2000);expect(domainTechYear('ai',[])).toBeUndefined();
 expect(fieldRange('cpu','cores',['cpu-compute-1'])).toEqual({min:1,max:1});
 expect(fieldRange('cpu','process',['cpu-compute-1']).min).toBe(180);
 expect(fieldOptions('ram','memoryGen',['ram-compute-1'])).toEqual(['SDR','DDR']);
});

it('research moves the technology year to 2100 and opens year-2100 limits',()=>{
 const year=(share:number)=>hardwareTechYear('gpu',researchTo({research:{completed:[] as string[]}},'gpu',share).research.completed);
 expect(Math.abs(year(.25)-2025)).toBeLessThan(1);expect(Math.abs(year(.5)-2050)).toBeLessThan(1);expect(year(1)).toBe(eraBalance.endYear);
 const all=researchTo({research:{completed:[] as string[]}},'cpu',1).research.completed;
 expect(frontierSpec('cpu',all)).toMatchObject({cores:4096,process:.1});
 expect(techYear(all,'cpu',['compute','capacity'])).toBe(2100);
 // DDR2 is 2004 technology: it opens once RAM research reaches 2004, not before.
 const ram=(share:number)=>fieldOptions('ram','memoryGen',researchTo({research:{completed:[] as string[]}},'ram',share).research.completed);
 expect(ram(.02)).not.toContain('DDR2');expect(ram(.04)).toContain('DDR2');expect(ram(1).at(-1)).toBe('DDR9');
});

it('market expectations rise with the calendar so products age',()=>{
 for(const kind of ['cpu','gpu','pc'] as const){
  expect(marketReference(kind,0)).toBe(productCatalog[kind].reference);
  const decade=marketReference(kind,eraBalance.daysPerYear*10),later=marketReference(kind,eraBalance.daysPerYear*30);
  expect(decade).toBeGreaterThan(marketReference(kind,0));expect(later).toBeGreaterThan(decade);
 }
 expect(marketReference('os',eraBalance.daysPerYear*30)).toBe(productCatalog.os.reference);
 expect(typicalSpec('cpu',0)).toMatchObject({cores:1,process:180});
 // A launched CPU sells less once the market has moved on by a decade.
 let s=command(command(start(),{type:'research',id:'cpu-compute-1'}),{type:'advance',days:7});
 s=command(s,{type:'design',kind:'cpu',name:'C',spec:{cores:1,clock:.8,ipc:1,process:180,cache:.25,cooling:40,socket:'Atlas'},price:40000});
 s=command(command(s,{type:'advance',days:14}),{type:'launch',id:'p-1'});s.products[0].inventory=10000;s.company.cash=1e10;
 const sold=(day:number)=>{const t=structuredClone(s);t.day=day;t.rivals=[];return command(t,{type:'advance',days:7}).products[0].sold-s.products[0].sold;};
 expect(sold(eraBalance.daysPerYear*10)).toBeLessThan(sold(30));
});

it('economy version 1 saves are migrated to real-world yen and the 2000 calendar once',()=>{
 const s=start();s.company.cash=500000;s.finance.revenue=1234;s.year=2026;delete (s as any).economyVersion;
 s.staff=[{id:'e-1',role:'research',skill:50,salary:1500}];s.staffSeq=1;
 const loaded=importSave(exportSave(s));
 expect(loaded.company.cash).toBe(50000000);expect(loaded.finance.revenue).toBe(123400);expect(loaded.staff[0].salary).toBe(150000);
 expect(loaded.year).toBe(2000);expect(loaded.economyVersion).toBe(2);
 expect(migrateEconomy(loaded)).toBe(loaded);expect(importSave(exportSave(loaded))).toEqual(loaded);
});
