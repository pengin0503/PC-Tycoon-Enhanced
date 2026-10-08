import {designSchema,clusterSchema,type LLMDesign,type ComputeCluster} from './ai-schema';
import {aiBalance as b} from '../../content/src/ai';
export type {LLMDesign,ComputeCluster} from './ai-schema';
export type AIResearchEffects=Partial<Record<'compute'|'architecture'|'quantization'|'data'|'context'|'economics',number>>;
export function clusterCost(cluster:ComputeCluster,seconds:number,utilization=1){return cluster.powerWatts/1000*seconds/3600*b.electricityPerKwh*utilization+cluster.gpus*seconds/3600*b.operationsPerGpuHour+cluster.purchaseCost*seconds/b.lifetimeSeconds;}
export function estimateLLM(input:LLMDesign,hardware:ComputeCluster,technology:AIResearchEffects={}){
 const d=designSchema.parse(input),c=clusterSchema.parse(hardware);const trainingFlops=b.trainCoefficient*d.active*d.tokens;
 const efficiency=b.efficiency*c.network*c.cooling;const seconds=trainingFlops/(c.peakFlops*efficiency)*(d.architecture==='moe'?b.routingOverhead:1)*(1+d.context/b.contextReference*b.attentionOverhead/(1+(technology.context??0)))/(1+(technology.architecture??0)*b.architectureEfficiency+(technology.compute??0)*b.computeEfficiency);
 const trainingMemoryBytes=d.total*b.trainingBytesPerParameter;
 const dataCost=d.tokens/1e9*b.dataCostPerBillion*(b.dataBase+b.dataQuality*d.quality+b.dataDiversity*d.diversity)*Math.exp(-(technology.data??0));
 return{trainingFlops,seconds,trainingMemoryBytes,cost:Math.ceil(dataCost+clusterCost(c,seconds)*Math.exp(-(technology.economics??0))),dataCost};
}
export function estimateInference(input:LLMDesign,hardware:ComputeCluster,bits:4|8|16,context:number,batch:number,technology:AIResearchEffects={}){
 const d=designSchema.parse(input),c=clusterSchema.parse(hardware);if(![4,8,16].includes(bits)||!Number.isInteger(context)||context<128||context>d.context||!Number.isInteger(batch)||batch<1||batch>256)throw new Error('推論設定が不正です');
 const weightBytes=d.total*bits/8;const kvBytes=2*d.layers*d.hidden*context*batch*b.kvBytesPerElement*(d.attention==='grouped'?b.groupedKvFactor:1);const reservedBytes=weightBytes*b.reserveFactor;
 const tokensPerSecond=c.peakFlops*b.efficiency*c.network*c.cooling*b.inferenceUtilization/(2*d.active*(1+context/b.contextReference*b.attentionOverhead/(1+(technology.context??0))))*b.quantSpeed[bits]*Math.min(b.maxBatchSpeed,Math.sqrt(batch))*(1+(technology.quantization??0)*b.quantResearchSpeed);
 return{weightBytes,kvBytes,reservedBytes,memoryBytes:weightBytes+kvBytes+reservedBytes,tokensPerSecond,qualityPenalty:b.quantPenalty[bits]*Math.exp(-(technology.quantization??0))};
}
export function benchmarks(d:LLMDesign,tech=0){
 designSchema.parse(d);const depth=Math.min(b.benchmarkDepthCeiling,Math.log2(d.layers+1)/Math.log2(b.benchmarkReferenceLayers));
 const compute=(d.active/1e9)**b.parameterExponent*(d.tokens/1e9)**b.tokenExponent*d.quality*(b.diversityFloor+(1-b.diversityFloor)*d.diversity)*(1+Math.min(b.techBonusCeiling,tech))*depth*(d.attention==='grouped'?b.groupedScore:1);
 const base=b.benchmarkCeiling*(1-Math.exp(-compute));const breadth=Math.min(b.breadthCeiling,1+Math.log2(d.total/d.active)*b.breadthBonus);
 const clamp=(n:number)=>Math.max(0,Math.min(b.benchmarkCeiling,Math.round(n)));
 return{math:clamp(base*b.mathScore),coding:clamp(base*(b.codingFloor+b.codingQuality*d.quality)),knowledge:clamp(base*breadth),reasoning:clamp(base*(d.architecture==='moe'?b.moeReasoning:1)),multilingual:clamp(base*(b.diversityFloor+(1-b.diversityFloor)*d.diversity)*breadth)};
}
