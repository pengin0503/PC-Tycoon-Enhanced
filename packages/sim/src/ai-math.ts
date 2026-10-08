import {designSchema,clusterSchema,type LLMDesign,type ComputeCluster} from './ai-schema';
import {aiBalance as b} from '../../content/src/ai';
export type {LLMDesign,ComputeCluster} from './ai-schema';
export type AIResearchEffects=Partial<Record<'compute'|'architecture'|'quantization'|'data'|'context'|'economics',number>>;
export function clusterCost(cluster:ComputeCluster,seconds:number,utilization=1){return cluster.powerWatts/1000*seconds/3600*b.electricityPerKwh*utilization+cluster.gpus*seconds/3600*b.operationsPerGpuHour+cluster.purchaseCost*seconds/b.lifetimeSeconds;}
export function estimateLLM(input:LLMDesign,hardware:ComputeCluster,technology:AIResearchEffects={}){
 const d=designSchema.parse(input),c=clusterSchema.parse(hardware);const trainingFlops=b.trainCoefficient*d.active*d.tokens;
 const efficiency=b.efficiency*c.network*c.cooling;const seconds=trainingFlops/(c.peakFlops*efficiency)*(d.architecture==='moe'?b.routingOverhead:1)*(1+d.context/8192*b.attentionOverhead/(1+(technology.context??0)))/(1+(technology.architecture??0)*.2+(technology.compute??0)*.1);
 const trainingMemoryBytes=d.total*b.trainingBytesPerParameter;
 const dataCost=d.tokens/1e9*b.dataCostPerBillion*(.2+.5*d.quality+.3*d.diversity)*Math.exp(-(technology.data??0));
 return{trainingFlops,seconds,trainingMemoryBytes,cost:Math.ceil(dataCost+clusterCost(c,seconds)*Math.exp(-(technology.economics??0))),dataCost};
}
export function estimateInference(input:LLMDesign,hardware:ComputeCluster,bits:4|8|16,context:number,batch:number,technology:AIResearchEffects={}){
 const d=designSchema.parse(input),c=clusterSchema.parse(hardware);if(![4,8,16].includes(bits)||!Number.isInteger(context)||context<128||context>d.context||!Number.isInteger(batch)||batch<1||batch>256)throw new Error('推論設定が不正です');
 const weightBytes=d.total*bits/8;const kvBytes=2*d.layers*d.hidden*context*batch*b.kvBytesPerElement*(d.attention==='grouped'?.25:1);const reservedBytes=weightBytes*b.reserveFactor;
 const tokensPerSecond=c.peakFlops*b.efficiency*c.network*c.cooling*b.inferenceUtilization/(2*d.active*(1+context/8192*b.attentionOverhead/(1+(technology.context??0))))*b.quantSpeed[bits]*Math.min(2,Math.sqrt(batch))*(1+(technology.quantization??0)*.1);
 return{weightBytes,kvBytes,reservedBytes,memoryBytes:weightBytes+kvBytes+reservedBytes,tokensPerSecond,qualityPenalty:b.quantPenalty[bits]*Math.exp(-(technology.quantization??0))};
}
export function benchmarks(d:LLMDesign,tech=0){
 designSchema.parse(d);const depth=Math.min(1.2,Math.log2(d.layers+1)/Math.log2(25));
 const compute=(d.active/1e9)**.25*(d.tokens/1e9)**.25*d.quality*(.5+.5*d.diversity)*(1+Math.min(.5,tech))*depth*(d.attention==='grouped'?.99:1);
 const base=b.benchmarkCeiling*(1-Math.exp(-compute));const breadth=Math.min(1.12,1+Math.log2(d.total/d.active)*.03);
 const clamp=(n:number)=>Math.max(0,Math.min(b.benchmarkCeiling,Math.round(n)));
 return{math:clamp(base*.95),coding:clamp(base*(.7+.3*d.quality)),knowledge:clamp(base*breadth),reasoning:clamp(base*(d.architecture==='moe'?.94:1)),multilingual:clamp(base*(.5+.5*d.diversity)*breadth)};
}
