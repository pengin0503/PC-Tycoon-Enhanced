import {it,expect} from 'vitest';
import {techById,techCatalog} from '../packages/content/src/tech-catalog';
import {techEffectText,researchHint,prerequisiteNames} from '../apps/web/src/research-hints';
import {unlockBranch} from './research-helpers';

it('appearance research cards name the grade they unlock, not a percentage bonus',()=>{
 expect(techEffectText(techById.get('cpu-visual-1')!,[])).toBe('外観グレード 1 を解放');
 expect(techEffectText(techById.get('cpu-visual-5')!,[])).toBe('外観グレード 5 を解放');
 const later=techCatalog.find(t=>t.category==='cpu'&&t.axis==='visual'&&t.level>5);
 if(later)expect(techEffectText(later,[])).not.toMatch(/%/);
});

it('a completed card keeps showing what its own stage unlocked after later stages are done',()=>{
 const level1=techById.get('cpu-cores-1')!;
 const before=techEffectText(level1,['cpu-compute-1']);
 expect(before).toBe('コア数上限 2コア');
 const maxed=unlockBranch({research:{completed:['cpu-compute-1']}},'cpu','cores',50).research.completed;
 expect(techEffectText(level1,maxed)).toBe(before);
 expect(techEffectText(techById.get('cpu-cores-50')!,maxed)).toBe('コア数上限 4,096コア');
});

it('cards name the single specification, option or feature each technology unlocks',()=>{
 expect(techEffectText(techById.get('cpu-compute-1')!,[])).toBe('CPUの開発を解放');
 expect(techEffectText(techById.get('motherboard-compute-1')!,[])).toBe('マザーボードの開発を解放');
 expect(techEffectText(techById.get('cpu-process-1')!,['cpu-compute-1'])).toMatch(/^製造プロセス下限 /);
 // SMT is 2002 technology: the first stage of its branch reaches 2002.
 expect(techEffectText(techById.get('cpu-smt-1')!,['cpu-compute-1'])).toBe('同時マルチスレッディング 「あり」を解放');
 expect(techEffectText(techById.get('monitor-panel-2')!,['monitor-compute-1','monitor-panel-1'])).toBe('パネル方式 「IPS」を解放');
 expect(techEffectText(techById.get('monitor-panel-1')!,['monitor-compute-1'])).toBe('パネル方式の研究を進める（次：「IPS」）');
 expect(techEffectText(techById.get('os-security-1')!,['os-compute-1'])).toBe('OS機能「セキュリティ」を解放');
 // Names use the development screen's category labels, never internal keys.
 for(const t of techCatalog)if(t.category!=='ai')expect(t.label,t.id).not.toMatch(/MOTHERBOARD|STORAGE|MONITOR|LAPTOP|PSU|[a-z][A-Z]|-/);
 expect(researchHint('motherboard',['usb'])).toBe('「マザーボード USBポート」の研究で設計できる範囲が広がります。');
 expect(researchHint('ram',['memoryGen'])).toBe('「RAM メモリ世代」の研究で選べる方式が増えます。');
 expect(prerequisiteNames(techById.get('cpu-cores-2')!)).toEqual(['CPU コア数 第1段階','CPU 基盤技術']);
});

it('cards only promise percentage bonuses that the simulation applies',()=>{
 for(const t of techCatalog){
  const text=techEffectText(t,[]);
  if(t.category!=='ai')expect(text,t.id).not.toMatch(/\+[\d.]+%/);
 }
});
