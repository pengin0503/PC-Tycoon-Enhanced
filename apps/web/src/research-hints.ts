import {axisLabels,type Tech} from '../../../packages/content/src/research';
import {productCatalog,deviceCooling} from '../../../packages/content/src/devices';
import {hardwareCatalog} from '../../../packages/content/src/hardware';
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
const directAxes=new Set(['power','cost','reliability','capacity','visual']);
const hasDirectEffect=(t:Tech)=>t.category==='ai'||(directAxes.has(t.axis)&&!(t.category==='os'&&t.axis==='capacity'));
/**
 * What completing `t` (with its earlier stages) gives: the slider bounds it widens and any direct bonus.
 * Bounds are shown as they will be once this stage is done.
 */
export function techEffectText(t:Tech,completed:readonly string[]){
 const chain=new Set(completed);for(let level=1;level<=t.level;level++)chain.add(`${t.category}-${t.axis}-${level}`);
 const after=[...chain];
 const sliders=slidersFor(t.category).filter(f=>f.unlock?.axes.includes(t.axis)).map(f=>{
  const r=unlockedRange(f,t.category,after);return `${f.label}${f.lowerIsBetter?`下限 ${f.format(r.min)}`:`上限 ${f.format(r.max)}`}`;
 });
 const direct=hasDirectEffect(t)?[`${t.axis==='capacity'&&t.category!=='ai'?'開発速度':axisLabels[t.axis]} +${(t.effect*100).toFixed(1)}%`]:[];
 if(t.axis==='compute'&&t.level===1&&t.category!=='ai')return `${domainLabel(t.category)}の開発を解放`;
 return [...sliders,...direct].join(' / ')||`${axisLabels[t.axis]} +${(t.effect*100).toFixed(1)}%`;
}
