import {hardwareKinds,researchDomains,visualKinds,aiResearchAxes,axisLabels,researchBalance,researchLevels,type Tech,type TechKind,type HardwareKind} from './research';
import {designFields} from './hardware';
import {productCatalog,deviceCooling} from './devices';
import {osSliders,osFeatureResearch,osFeatureLabels,type OSFeature} from './os';
import {aiDesignSliders} from './ai';
import {eraBalance} from './era';

/**
 * One research branch. Every branch improves exactly one thing: a design slider's range, the choices of one option
 * field, one AI bonus or one OS feature. `levels`: number of stages; `weight`: research-point cost multiplier, chosen so
 * that researching every branch of a category costs about what the four shared branches of earlier versions did.
 */
export type Branch={category:string,axis:string,label:string,levels:number,kind:TechKind,weight:number};
const isHardware=(category:string):category is HardwareKind=>(hardwareKinds as readonly string[]).includes(category);
/** Category name shown in research names: the same label as the development screen (e.g. マザーボード). */
export const domainLabel=(category:string)=>category==='ai'?'AI':productCatalog[category as keyof typeof productCatalog]?.label??category;
/** Stages an option branch needs: one stage per two technology years up to its last option. */
const optionLevels=(yearsByOption:Readonly<Record<string,number>>)=>Math.max(1,Math.ceil((Math.max(...Object.values(yearsByOption))-eraBalance.startYear)/((eraBalance.endYear-eraBalance.startYear)/researchLevels)));
/** Slider branches of earlier versions' shared research per category, used to keep total research cost comparable. */
const previousBranches:Record<string,number>={pc:3,laptop:3,os:3};
const featureLabel:Record<string,string>={security:'セキュリティ機能',media:'メディア機能',games:'ゲーム機能',store:'アプリストア'};
function specBranches(category:string):Branch[]{
 const raw:Omit<Branch,'weight'>[]=[];
 if(isHardware(category))for(const [key,f] of designFields(category)){
  if(f.unlock)raw.push({category,axis:key,label:f.label,levels:researchLevels,kind:'slider'});
  else if(f.optionUnlock)raw.push({category,axis:key,label:f.label,levels:optionLevels(f.optionUnlock.years),kind:'option'});
 }
 if(category==='pc'||category==='laptop')raw.push({category,axis:'cooling',label:deviceCooling[category].label,levels:researchLevels,kind:'slider'});
 if(category==='os')for(const [key,f] of Object.entries(osSliders))raw.push({category,axis:key,label:f.label,levels:researchLevels,kind:'slider'});
 const span=raw.reduce((n,b)=>n+b.levels/researchLevels,0);
 const weight=span?(previousBranches[category]??4)/span:1;
 return raw.map(b=>({...b,weight}));
}
/** Every research branch of a category, foundation first. */
export function researchBranches(category:string):Branch[]{
 if(category==='ai'){
  const sliders=[...new Map(Object.values(aiDesignSliders).flatMap(s=>'unlock' in s?[[s.unlock.axes[0],s.label] as const]:[])).entries()]
   .map(([axis,label])=>({category,axis,label:axis==='params'?'モデル規模（パラメータ数）':label,levels:researchLevels,kind:'slider' as const,weight:.5}));
  return [...aiResearchAxes.map(axis=>({category,axis,label:axisLabels[axis],levels:researchLevels,kind:'effect' as const,weight:1})),...sliders];
 }
 const foundation:Branch={category,axis:'compute',label:'基盤技術',levels:1,kind:'foundation',weight:1};
 const features:Branch[]=category==='os'?Object.keys(osFeatureResearch).map(f=>({category,axis:f,label:featureLabel[f]??osFeatureLabels[f as OSFeature],levels:1,kind:'feature' as const,weight:1})):[];
 return [foundation,...specBranches(category),...features];
}
const stageLabel=(b:Branch,level:number)=>{
 const domain=domainLabel(b.category);
 if(b.category==='ai'){
  if(b.axis==='compute'&&level===1)return 'AI Transformer 基盤技術';
  if(b.axis==='architecture'&&level===1)return 'AI MoE設計';
  if(b.axis==='quantization'&&level===1)return 'AI 量子化';
 }
 if(b.kind==='foundation'||b.kind==='feature')return `${domain} ${b.label}`;
 return `${domain} ${b.label} 第${level}段階`;
};
const baseTechCatalog:Tech[]=researchDomains.flatMap(category=>researchBranches(category).flatMap(b=>Array.from({length:b.levels},(_,i)=>{
 const level=i+1,foundation=b.axis==='compute'&&level===1;
 return {id:`${category}-${b.axis}-${level}`,label:foundation&&category!=='ai'?`${domainLabel(category)} 基盤技術`:stageLabel(b,level),category,axis:b.axis,level,generation:1+Math.floor(i/5),kind:foundation?'foundation' as const:b.kind,branchLabel:b.label,
  cost:Math.round(researchBalance.cost*level**researchBalance.costExponent*b.weight),work:researchBalance.work*level**researchBalance.workExponent*b.weight,
  prerequisites:[...(i?[`${category}-${b.axis}-${i}`]:[]),...(b.axis==='compute'?[]:[`${category}-compute-1`])],
  effect:category==='ai'&&b.kind!=='slider'?(researchBalance.effects[b.axis]??0)/(1+i*researchBalance.diminishing):0};
})));
/** Appearance grades: they raise demand and the design review score only. */
const visualStages=['基礎外装','精密加工外装','高級素材','発光装飾','シグネチャー外装'];
export const visualTechCatalog:Tech[]=visualKinds.flatMap(category=>visualStages.map((stage,i)=>({
 id:`${category}-visual-${i+1}`,label:`${domainLabel(category)} 外観 第${i+1}段階 ${stage}`,
 category,axis:'visual',level:i+1,generation:i+1,kind:'visual' as const,branchLabel:axisLabels.visual,cost:Math.round(1500*(i+1)**1.15),
 work:6+3*i,prerequisites:[i===0?`${category}-compute-1`:`${category}-visual-${i}`],effect:.02
})));
export const techCatalog:Tech[]=[...baseTechCatalog,...visualTechCatalog];
/** Every technology is purchasable (kept as a name for callers that filtered retired branches). */
export const activeTechCatalog=techCatalog;
export function unlockedVisualTier(completed:readonly string[],category:string):number{
 let tier=0;for(let level=1;level<=5;level++){if(!completed.includes(`${category}-visual-${level}`))break;tier=level;}
 return tier;
}
export const techById=new Map(techCatalog.map(t=>[t.id,t]));
/** Summed direct bonus of an AI branch (other categories' research only widens ranges and unlocks options). */
export function techEffect(completed:readonly string[],category:string,axis:string){if(category!=='ai')return 0;return completed.reduce((n,id)=>{const t=techById.get(id);return n+(t?.category===category&&t.axis===axis?t.effect:0);},0);}
/**
 * Completed research ids equivalent to `share` (0..1) of every branch of a category: what a rival or the market of that
 * technology level has. Option branches stop at their last stage; the foundation is always included.
 */
export function researchAtShare(category:string,share:number):string[]{
 const s=Math.min(1,Math.max(0,share));
 return researchBranches(category).flatMap(b=>{
  const level=b.axis==='compute'?1+Math.round(s*(b.levels-1)):b.kind==='feature'?(s>0?1:0):Math.min(b.levels,Math.round(s*researchLevels));
  return Array.from({length:level},(_,i)=>`${category}-${b.axis}-${i+1}`);
 });
}
