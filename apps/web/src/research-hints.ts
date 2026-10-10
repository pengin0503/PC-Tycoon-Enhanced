import {axisLabels,type Tech,type HardwareKind} from '../../../packages/content/src/research';
import {deviceCooling} from '../../../packages/content/src/devices';
import {hardwareCatalog,hardwareTechYear,designFields} from '../../../packages/content/src/hardware';
import {techYear,unlockedOptions} from '../../../packages/content/src/era';
import {osSliders,osFeatureLabels,type OSFeature} from '../../../packages/content/src/os';
import {domainLabel,researchBranches,techById} from '../../../packages/content/src/tech-catalog';
import {aiDesignSliders} from '../../../packages/content/src/ai';
import {unlockedRange,type RangeSpec} from '../../../packages/content/src/unlocks';
import {formatValue} from './RangeField';

export {domainLabel};
/** Name of the research branch `axis` of a category as research cards show it, e.g. 「CPU コア数」. */
export function branchName(category:string,axis:string){
 const label=researchBranches(category).find(b=>b.axis===axis)?.label??axisLabels[axis]??axis;
 return `${domainLabel(category)} ${label}`;
}
/** Which research branch widens a slider or adds choices to an option field, e.g. 「CPU コア数」. */
export function researchHint(category:string,axes:readonly string[]){
 const option=axes.every(a=>researchBranches(category).find(b=>b.axis===a)?.kind==='option');
 return `${axes.map(a=>`「${branchName(category,a)}」`).join('・')}の研究で${option?'選べる方式が増えます':'設計できる範囲が広がります'}。`;
}
/** Names of the technologies a card still needs, instead of their internal ids. */
export function prerequisiteNames(t:Tech){return t.prerequisites.map(id=>techById.get(id)?.label??id);}
/** Slider description followed by the research that widens it. */
export function describeWithResearch(description:string|undefined,category:string,axes:readonly string[]|undefined){
 if(!axes)return description;
 return [description,researchHint(category,axes)].filter(Boolean).join(' ');
}

/**
 * Technology year a product domain's research has reached (games start with year-2000 technology and full research
 * reaches 2200 through the advanced tier). AI and OS sliders are not tied to hardware eras, so they have none.
 */
export function domainTechYear(category:string,completed:readonly string[]):number|undefined{
 if(category in hardwareCatalog)return Math.floor(hardwareTechYear(category as keyof typeof hardwareCatalog,completed));
 if(category==='pc'||category==='laptop')return Math.floor(techYear(completed,category,deviceCooling[category].unlock.axes));
 return undefined;
}

type Slider=RangeSpec&{label:string,format:(n:number)=>string};
const percent=(n:number)=>`${Math.round(n*100)}%`;
/** Research-gated sliders of a research domain. */
function slidersFor(category:string):Slider[]{
 if(category in hardwareCatalog)return designFields(category as HardwareKind).map(([,f])=>f).filter(f=>f.unlock).map(f=>({...f,format:(n:number)=>formatValue(n,f.unit)}));
 if(category==='pc'||category==='laptop'){const f=deviceCooling[category];return [{...f,format:(n:number)=>formatValue(n,f.unit)}];}
 if(category==='os')return Object.values(osSliders).map(f=>({...f,format:percent}));
 if(category==='ai')return Object.values(aiDesignSliders).filter(f=>'unlock' in f).map(f=>({...f,format:(n:number)=>formatValue(n,f.unit)}));
 return [];
}
/** Branches whose research still applies a direct bonus (the others only widen sliders). OS capacity only widens support. */
const hasDirectEffect=(t:Tech)=>t.category==='ai';
/** Appearance research unlocks one grade per stage up to this tier (`unlockedVisualTier`); later stages add nothing. */
const maxVisualTier=5;
/**
 * What completing `t` (with its earlier stages) gives: the slider bounds it widens and any direct bonus.
 * Bounds are shown as they are right after this stage, so a completed card keeps showing what that stage unlocked
 * even when later stages of the same branch are done.
 */
export function techEffectText(t:Tech,completed:readonly string[]){
 if(t.axis==='visual')return t.level<=maxVisualTier?`外観グレード ${t.level} を解放`:`外観グレードは最上位の${maxVisualTier}まで解放済みです`;
 const branch=`${t.category}-${t.axis}-`;
 const chain=new Set(completed.filter(id=>!id.startsWith(branch)||Number(id.slice(branch.length))<=t.level));
 for(let level=1;level<=t.level;level++)chain.add(`${branch}${level}`);
 const after=[...chain];
 const sliders=slidersFor(t.category).filter(f=>f.unlock?.axes.includes(t.axis)).map(f=>{
  const r=unlockedRange(f,t.category,after);return `${f.label}${f.lowerIsBetter?`下限 ${f.format(r.min)}`:`上限 ${f.format(r.max)}`}`;
 });
 const direct=hasDirectEffect(t)?[`${axisLabels[t.axis]??t.branchLabel} +${(t.effect*100).toFixed(1)}%`]:[];
 if(t.kind==='foundation'&&t.category!=='ai')return `${domainLabel(t.category)}の開発を解放`;
 if(t.kind==='feature')return t.category==='cpu'?'自社独自のCPUソケットを開発できるようになります':`OS機能「${osFeatureLabels[t.axis as OSFeature]??t.branchLabel}」を解放`;
 if(t.kind==='option'&&t.category in hardwareCatalog){
  const f=designFields(t.category as HardwareKind).find(([k])=>k===t.axis)?.[1];
  if(f?.options){
   const before=new Set(unlockedOptions(f.options,f.optionUnlock,t.category,after.filter(id=>id!==`${branch}${t.level}`)));
   const added=unlockedOptions(f.options,f.optionUnlock,t.category,after).filter(o=>!before.has(o)).map(o=>`「${f.optionLabels?.[o]??o}」`);
   const next=f.options.find(o=>!before.has(o)&&!added.includes(`「${f.optionLabels?.[o]??o}」`));
   return added.length?`${f.label} ${added.join('・')}を解放`:`${f.label}の研究を進める${next?`（次：「${f.optionLabels?.[next]??next}」）`:''}`;
  }
 }
 return [...sliders,...direct].join(' / ')||'設計可能な技術領域を解放';
}
