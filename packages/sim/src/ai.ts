import {aiBalance as b,aiDesignSliders,type AISlider} from '../../content/src/ai';
import {unlockedRange} from '../../content/src/unlocks';
import {expense,income,logEvent} from './finance';
import {removeStock} from './inventory';
import {estimateLLM,estimateInference,benchmarks,clusterCost,type AIResearchEffects,type LLMDesign} from './ai-math';
import {workBonus} from './management';
import {techEffect} from '../../content/src/research';
import {nextRandom} from './random';
/** Current selectable range of a model-design slider, in its display unit (parameters/tokens in billions). */
export function aiDesignRange(key:AISlider,completed:readonly string[]){return unlockedRange(aiDesignSliders[key],'ai',completed);}
/** Rejects model designs beyond what AI research has unlocked. */
export function assertAIDesignUnlocked(d:LLMDesign,completed:readonly string[]){
 for(const key of ['total','active','layers','hidden','context','tokens'] as const){
  const slider=aiDesignSliders[key],range=aiDesignRange(key,completed),value=d[key]/slider.scale;
  if(value>range.max+1e-9)throw new Error(`${slider.label}は現在の研究では${range.max.toLocaleString('ja-JP')}${slider.unit}までです`);
 }
}
/** FLOPS of one own GPU: grows with the square of its score, so year-2000 cards are far too slow for language models. */
export function gpuFlops(score:number){return b.gpuFlopsAtReference*(score/b.gpuReferenceScore)**b.gpuFlopsExponent;}
export function aiEffects(s:GameState):AIResearchEffects{return Object.fromEntries(['compute','architecture','quantization','data','context','economics'].map(axis=>[axis,techEffect(s.research.completed,'ai',axis)]));}
import type {GameState,GameCommand} from './types';
function settleSubscription(s:GameState,service:NonNullable<GameState['models'][number]['service']>){
 const userDays=service.subscriptionUserDays;
 if(service.mode!=='subscription'||userDays===0)return;
 const amount=Math.round(userDays*service.subscriptionPrice/30*(1-b.fee-b.refund));
 if(amount){income(s,amount);service.revenue+=amount;}
 service.subscriptionUserDays=0;
}
export function aiCommand(s:GameState,c:GameCommand):boolean{
 if(c.type==='buyCluster'){
  if(!s.research.completed.includes('ai-compute-1'))throw new Error('AI基盤研究が必要です');if(s.clusters.length>=20)throw new Error('クラスタ数の上限です');
  const own=s.products.find(p=>p.id===c.gpuId&&p.kind==='gpu'&&p.launched&&p.remaining===0);
  if(!own)throw new Error('自社GPUを開発・発売してください');
  if(!own.line||own.target===0)throw new Error('自社GPUの生産ラインが稼働していません');
  if(own.inventory<c.gpus)throw new Error('自社GPU在庫が不足しています');
  const server=c.serverId==='vendor'?undefined:s.products.find(p=>p.id===c.serverId&&p.kind==='pc'&&p.spec.purpose==='server'&&p.launched);
  if(c.serverId!=='vendor'&&(!server||server.inventory<1))throw new Error('自社サーバー在庫が必要です');
  const cost=server?0:b.serverCost;expense(s,cost,false,true);
  const ownGpuValue=removeStock(own,c.gpus);const ownServerValue=server?removeStock(server,1):0;
  s.clusters.push({id:`c-${s.clusters.length+1}`,gpuId:c.gpuId,serverId:c.serverId,gpus:c.gpus,peakFlops:gpuFlops(own.performance)*c.gpus,vramBytes:Number(own.spec.vram)*1e9*c.gpus,powerWatts:own.power*c.gpus+(server?.power??0),network:c.network*Math.min(1,server?server.performance/b.serverPerformanceReference:1),cooling:c.cooling,purchaseCost:cost+ownGpuValue+ownServerValue,purchaseDay:s.day});
  logEvent(s,'clusterPurchased',String(c.gpus));return true;
 }
 if(c.type==='trainModel'){
  if(!s.research.completed.includes('ai-compute-1')||c.design.architecture==='moe'&&!s.research.completed.includes('ai-architecture-1'))throw new Error('AI設計の研究が必要です');
  const cluster=s.clusters.find(x=>x.id===c.clusterId);if(!cluster)throw new Error('クラスタが存在しません');if(clusterBusy(s,c.clusterId))throw new Error('クラスタは使用中です');
  if(s.models.length>=100)throw new Error('モデル数の上限です');assertAIDesignUnlocked(c.design,s.research.completed);const e=estimateLLM(c.design,cluster,aiEffects(s));if(e.trainingMemoryBytes>cluster.vramBytes)throw new Error('学習VRAMが不足しています');if(e.cost>c.budget)throw new Error('学習予算が不足しています');
  expense(s,e.cost);s.models.push({id:`m-${s.models.length+1}`,name:c.name,design:c.design,clusterId:c.clusterId,status:'training',remainingSeconds:e.seconds,initialSeconds:e.seconds,preparationRemaining:b.preparationDays,trainingCost:e.cost,scores:{math:0,coding:0,knowledge:0,reasoning:0,multilingual:0},service:null});logEvent(s,'trainingStarted',c.name);return true;
 }
 if(c.type==='deployModel'){
  const m=s.models.find(m=>m.id===c.id);const cluster=s.clusters.find(x=>x.id===c.clusterId);if(!m||m.status!=='ready'||!cluster)throw new Error('評価済みモデルとクラスタが必要です');
  if(c.bits!==16&&!s.research.completed.includes('ai-quantization-1'))throw new Error('量子化の研究が必要です');if(c.mode!=='open'&&clusterBusy(s,c.clusterId,m.id))throw new Error('クラスタは使用中です');
  const e=estimateInference(m.design,cluster,c.bits,c.context,c.batch,aiEffects(s));if(c.mode!=='open'&&e.memoryBytes>cluster.vramBytes)throw new Error('推論VRAMが不足しています');
  const old=m.service;
  if(old?.mode==='subscription'&&(c.mode!=='subscription'||c.subscriptionPrice!==old.subscriptionPrice))settleSubscription(s,old);
  m.service={enabled:true,clusterId:c.clusterId,bits:c.bits,context:c.context,batch:c.batch,mode:c.mode,apiPrice:c.apiPrice,subscriptionPrice:c.subscriptionPrice,subscriptionUserDays:c.mode==='subscription'?(old?.subscriptionUserDays??0):0,tokens:old?.tokens??0,users:0,revenue:old?.revenue??0,cost:old?.cost??0,speed:e.tokensPerSecond,memoryBytes:e.memoryBytes,qualityPenalty:e.qualityPenalty};return true;
 }
 if(c.type==='retireModel'){const m=s.models.find(m=>m.id===c.id);if(!m?.service)throw new Error('運用モデルが存在しません');settleSubscription(s,m.service);m.service.enabled=false;m.service.users=0;return true;}
 return false;
}
export function clusterBusy(s:GameState,id:string,except=''){return s.models.some(m=>m.id!==except&&(m.status==='training'&&m.clusterId===id||m.service?.enabled&&m.service.mode!=='open'&&m.service.clusterId===id));}
export function founderProjects(s:GameState){return Math.max(1,Number(s.research.active.length>0)+Number(s.products.some(p=>p.remaining>0))+Number(s.models.some(m=>m.status==='training')));}
export function aiWeekly(s:GameState){
 const jobs=s.models.filter(m=>m.status==='training');const founder=1/founderProjects(s);const bonus=workBonus(s,'ai');
 for(const m of jobs){m.remainingSeconds=Math.max(0,m.remainingSeconds-7*86400*(1+bonus/b.trainingStaffTimeScale));m.preparationRemaining=Math.max(0,m.preparationRemaining-7*(founder+bonus/b.preparationStaffScale)/jobs.length);
  if(m.remainingSeconds===0&&m.preparationRemaining===0){const [rand,seed]=nextRandom(s.seed);s.seed=seed;const failure=Math.max(0,b.failureThreshold-m.design.quality)*b.failureCoefficient/(1+bonus/b.preparationStaffScale);m.status=rand<failure?'failed':'ready';if(m.status==='ready')m.scores=benchmarks({...m.design,quality:m.design.quality+(1-m.design.quality)*(1-Math.exp(-techEffect(s.research.completed,'ai','data')))},techEffect(s.research.completed,'ai','compute')+techEffect(s.research.completed,'ai','architecture')*b.architectureScore);logEvent(s,m.status==='ready'?'trainingComplete':'trainingFailed',m.name);}
 }
}
export function aiMarketQuote(s:GameState){const level=Math.max(0,...s.rivals.filter(r=>!r.acquired).map(r=>r.researchLevel));const playerPrices=s.models.flatMap(m=>m.service?.enabled&&m.service.mode==='api'?[m.service.apiPrice]:[]);return {price:Math.max(b.marketPriceFloor,Math.round(Math.min(b.marketBasePrice/(1+level*b.competitorPriceDecay),...playerPrices.map(p=>p*b.priceUndercut)))),quality:Math.min(b.marketQualityCeiling,b.marketQualityBase+level*b.marketQualityPerTech)};}
export function aiDaily(s:GameState){
 const quote=aiMarketQuote(s);
 for(const m of s.models){const service=m.service;if(!service?.enabled||m.status!=='ready')continue;
  if(service.mode==='open'){s.company.awareness=Math.min(100,s.company.awareness+b.publicAwarenessDaily);s.company.reputation=Math.min(100,s.company.reputation+b.publicReputationDaily);continue;}
  const c=s.clusters.find(c=>c.id===service.clusterId)!;const score=Object.values(m.scores).reduce((n,v)=>n+v,0)/500*(1-service.qualityPenalty);
  const brand=(b.brandAwarenessFloor+s.company.awareness/100)*(b.brandReputationFloor+s.company.reputation/100);const [rand,seed]=nextRandom(s.seed);s.seed=seed;
  const capacity=Math.floor(service.speed*86400*b.serviceCapacityUtilization);const competition=1/(1+quote.quality/Math.max(1,score*100)*service.apiPrice/quote.price*b.competition);
  let tokens=0;
  if(service.mode==='api')tokens=Math.min(capacity,Math.floor(b.apiWeeklyDemand/7*score*brand*competition*(b.marketBasePrice/service.apiPrice)**b.priceElasticity*(b.demandFloor+rand*b.demandVariance)));
  else{service.users=Math.min(Math.floor(capacity/(b.tokensPerSubscriberMonth/30)),Math.floor(b.subscriptionDemand*score*brand*(b.subscriptionReferencePrice/service.subscriptionPrice)**b.priceElasticity));tokens=Math.floor(service.users*b.tokensPerSubscriberMonth/30);
   service.subscriptionUserDays=Math.min(Number.MAX_SAFE_INTEGER,service.subscriptionUserDays+service.users);}
  const gross=service.mode==='api'?Math.round(tokens/1e6*service.apiPrice*(1-b.fee-b.refund)):0;
  if(gross){income(s,gross);service.revenue+=gross;}
  const cost=Math.ceil(clusterCost(c,86400,Math.min(1,tokens/Math.max(1,capacity)))*Math.exp(-techEffect(s.research.completed,'ai','economics')));expense(s,cost,true);service.cost+=cost;service.tokens+=tokens;
  if(s.company.debt>0){settleSubscription(s,service);service.enabled=false;service.users=0;logEvent(s,'serviceStopped',m.name);}
 }
}
export function aiMonthly(s:GameState){for(const m of s.models){const v=m.service;if(v)settleSubscription(s,v);}}
export function aiHardwareBoost(s:GameState){return Math.max(0,...s.models.filter(m=>m.status==='ready'&&m.service?.enabled).map(m=>Object.values(m.scores).reduce((n,v)=>n+v,0)/500))*b.aiHardwareBoost;}

