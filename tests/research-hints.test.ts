import {it,expect} from 'vitest';
import {techById,techCatalog} from '../packages/content/src/research';
import {techEffectText} from '../apps/web/src/research-hints';
import {unlockBranch} from './research-helpers';

it('appearance research cards name the grade they unlock, not a percentage bonus',()=>{
 expect(techEffectText(techById.get('cpu-visual-1')!,[])).toBe('外観グレード 1 を解放');
 expect(techEffectText(techById.get('cpu-visual-5')!,[])).toBe('外観グレード 5 を解放');
 const later=techCatalog.find(t=>t.category==='cpu'&&t.axis==='visual'&&t.level>5);
 if(later)expect(techEffectText(later,[])).not.toMatch(/%/);
});

it('a completed card keeps showing what its own stage unlocked after later stages are done',()=>{
 const level1=techById.get('cpu-capacity-1')!;
 const before=techEffectText(level1,['cpu-compute-1']);
 const maxed=unlockBranch({research:{completed:['cpu-compute-1']}},'cpu','capacity',50).research.completed;
 expect(techEffectText(level1,maxed)).toBe(before);
 expect(techEffectText(techById.get('cpu-capacity-50')!,maxed)).toContain('コア数上限 4,096コア');
});

it('cards only promise percentage bonuses that the simulation applies',()=>{
 for(const t of techCatalog){
  const text=techEffectText(t,[]);
  if(t.axis==='compute'||t.axis==='compatibility'||t.axis==='visual'||(t.category==='os'&&t.axis==='capacity'))if(t.category!=='ai')expect(text,t.id).not.toMatch(/\+[\d.]+%/);
 }
});
