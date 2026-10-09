import {axisLabels,type Tech} from '../../../packages/content/src/research';
import {productCatalog,deviceCooling} from '../../../packages/content/src/devices';
import {hardwareCatalog,hardwareTechYear} from '../../../packages/content/src/hardware';
import {techYear} from '../../../packages/content/src/era';
import {osSliders} from '../../../packages/content/src/os';
import {aiDesignSliders} from '../../../packages/content/src/ai';
import {unlockedRange,type RangeSpec} from '../../../packages/content/src/unlocks';
import {formatValue} from './RangeField';

export const domainLabel=(d:string)=>d==='ai'?'AI':productCatalog[d as keyof typeof productCatalog]?.label??d.toUpperCase();
/** Which research branches widen a slider, e.g. 「CPU 演算・処理設計」. */
export function researchHint(category:string,axes:readonly string[]){
 return `${axes.map(a=>`「${domainLabel(category)} ${axisLabels[a]??a}」`).join('・')}の研究で上限が広がります。`;
}
/** Slider description followed by the research that widens it. */
export function describeWithResearch(description:string|undefined,category:string,axes:readonly string[]|undefined){
 if(!axes)return description;
 return [description,researchHint(category,axes)].filter(Boolean).join(' ');
}

/**
 * Technology year a product domain's research has reached (games start with year-2000 technology and full research
 * reaches 2100). AI and OS sliders are not tied to hardware eras, so they have none.
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
 if(category in hardwareCatalog)return Object.values(hardwareCatalog[category as keyof typeof hardwareCatalog].fields).filter(f=>f.unlock).map(f=>({...f,format:(n:number)=>formatValue(n,f.unit)}));
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
 const direct=hasDirectEffect(t)?[`${t.axis==='capacity'&&t.category!=='ai'?'開発速度':axisLabels[t.axis]} +${(t.effect*100).toFixed(1)}%`]:[];
 if(t.axis==='compute'&&t.level===1&&t.category!=='ai')return `${domainLabel(t.category)}の開発を解放`;
 return [...sliders,...direct].join(' / ')||'設計可能な技術領域を解放';
}
