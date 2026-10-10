import {reviewAxes,reviewBalance as b,reviewOutlets,reviewComments,fanBalance as f,presentations,type ReviewAxis,type PresentationKind} from '../../content/src/market';
import {marketReference} from './market';
import {requireRole} from './business';
import {hardwareBalance} from '../../content/src/hardware';
import {nextRandom} from './random';
import {expense,logEvent} from './finance';
import type {GameState,Product} from './types';

export type Review=NonNullable<Product['review']>;
/**
 * Review scale without a ceiling: up to 100 a value counts in full, beyond it with diminishing returns
 * (`b.overflowScale`), so an outstanding product keeps scoring higher without runaway numbers.
 */
export function softScore(v:number){const x=Math.max(0,v);return x<=100?x:100+b.overflowScale*Math.log1p((x-100)/b.overflowScale);}

/** Deterministic review axes and score (no outlet noise); used for the launch review and design-time forecasts. */
export function estimateReview(s:GameState,p:Pick<Product,'id'|'kind'|'performance'|'price'|'unitCost'|'reliability'|'spec'|'visual'>):{score:number,axes:Record<ReviewAxis,number>}{
 const reference=marketReference(p.kind,s.day);
 const others=[...s.products.filter(o=>o.id!==p.id&&o.launched&&o.discontinuedDay===undefined&&o.kind===p.kind),...s.rivals.flatMap(r=>r.products.filter(o=>o.kind===p.kind&&o.remaining===0))];
 const best=Math.max(reference,...others.map(o=>o.performance));
 const relative=p.performance/best;
 const performance=softScore(b.performanceFloor+b.performanceScale*relative**b.performanceExponent);
 const fair=p.kind==='os'?hardwareBalance.osReferencePrice:p.unitCost*hardwareBalance.priceCostMultiple;
 const value=softScore(b.valueScale*((fair/p.price)*Math.sqrt(Math.min(b.valuePerformanceCap,p.performance/reference)))**b.valueExponent);
 const quality=softScore(b.qualityBase+(p.reliability-hardwareBalance.reliabilityBase)*b.qualityScale);
 const design=softScore(p.kind==='os'?b.designBase+Number(p.spec.support??0)*b.osSupportDesign:b.designBase+(p.visual?.tier??0)*b.designPerTier);
 const previous=s.products.filter(o=>o.id!==p.id&&o.launched&&o.kind===p.kind);
 const innovation=previous.length?softScore(Math.max(b.innovationMin,b.innovationBase+(p.performance/Math.max(...previous.map(o=>o.performance))-1)*b.innovationScale)):b.innovationFirst;
 const axes:Record<ReviewAxis,number>={performance,value,quality,design,innovation};
 return {score:Math.round(reviewAxes.reduce((n,a)=>n+axes[a]*b.weights[a],0)),axes};
}
/** Fixed at launch: compares against every launched product of the same kind, own earlier models included. */
export function computeReview(s:GameState,p:Product):Review{
 const {score,axes}=estimateReview(s,p);
 const ranked=[...reviewAxes].sort((x,y)=>axes[y]-axes[x]);
 const outlets=reviewOutlets.map(o=>{
  const [r,next]=nextRandom(s.seed);s.seed=next;
  const outletScore=Math.round(Math.max(0,score*.6+axes[o.focus]*.4+(r-.5)*b.outletNoise));
  const comment=`${reviewComments[ranked[0]].good}${axes[o.focus]<60?reviewComments[o.focus].bad:reviewComments[ranked.at(-1)!].bad}`;
  return {name:o.name,score:outletScore,comment};
 });
 return {score,stars:starsFor(score),axes:Object.fromEntries(reviewAxes.map(a=>[a,Math.round(axes[a])])) as Record<ReviewAxis,number>,outlets};
}
export function starsFor(score:number){return Math.max(1,Math.min(5,Math.round(score/10)/2));}
/** Demand from the review: full effect up to 100 points, then a logarithmic bonus per doubling of the score. */
export function reviewDemandFactor(p:Pick<Product,'review'>){
 if(!p.review)return 1;const score=p.review.score;
 return b.demandFloor+b.demandRange*(Math.min(100,score)/100)**b.demandExponent+(score>100?b.demandOverflow*Math.log2(score/100):0);
}
export function fanDemandFactor(s:GameState){return Math.min(f.demandCap,1+Math.log10(1+s.company.fans)/f.demandLog);}
export function hypeFactor(p:Pick<Product,'hype'>){return 1+(p.hype??0)/100;}

/** Launch: pay for the presentation, publish the review, gain fans and awareness. */
export function launchReception(s:GameState,p:Product,kind:PresentationKind){
 const show=presentations[kind];
 if(kind!=='none')requireRole(s,'marketing');
 if(show.cost)expense(s,show.cost);
 const review=computeReview(s,p);p.review=review;
 if(show.hype)p.hype=show.hype;
 s.company.awareness=Math.min(100,s.company.awareness+show.awareness);
 s.company.fans+=Math.round(f.launchBase*(Math.min(100,review.score)/100)**2*(review.score>100?review.score/100:1)*(1+s.company.awareness/f.awarenessScale)*show.fans);
 logEvent(s,'reviewPublished',`${p.name}: ★${review.stars.toFixed(1)}（${review.score}点）`);
}
export function weeklyFans(s:GameState,p:Product,units:number){s.company.fans+=Math.round(units*f.perUnit*(p.review?p.review.score/100:.5));}
export function decayHype(p:Product){if(!p.hype)return;const next=p.hype*f.hypeWeeklyDecay;if(next<f.hypeFloor)delete p.hype;else p.hype=Math.round(next*100)/100;}
