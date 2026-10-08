import {designSchema,clusterSchema,type LLMDesign,type ComputeCluster} from './ai-schema';
import {aiBalance as b} from '../../content/src/ai';
export type {LLMDesign,ComputeCluster} from './ai-schema';
export function clusterCost(cluster:ComputeCluster,seconds:number,utilization=1){return cluster.powerWatts/1000*seconds/3600*b.electricityPerKwh*utilization+cluster.gpus*seconds/3600*b.operationsPerGpuHour+cluster.purchaseCost*seconds/b.lifetimeSeconds;}
export function estimateLLM(input:LLMDesign,hardware:ComputeCluster){
 const d=designSchema.parse(input),c=clusterSchema.parse(hardware);const trainingFlops=b.trainCoefficient*d.active*d.tokens;
 const efficiency=b.efficiency*c.network*c.cooling;const seconds=trainingFlops/(c.peakFlops*efficiency)*(d.architecture==='moe'?b.routingOverhead:1)*(1+d.context/8192*b.attentionOverhead);
 const trainingMemoryBytes=d.total*b.trainingBytesPerParameter;
 const dataCost=d.tokens/1e9*b.dataCostPerBillion*(.2+.5*d.quality+.3*d.diversity);
 return{trainingFlops,seconds,trainingMemoryBytes,cost:Math.ceil(dataCost+clusterCost(c,seconds)),dataCost};
}
export function estimateInference(input:LLMDesign,hardware:ComputeCluster,bits:4|8|16,context:number,batch:number){
 const d=designSchema.parse(input),c=clusterSchema.parse(hardware);if(![4,8,16].includes(bits)||!Number.isInteger(context)||context<128||context>d.context||!Number.isInteger(batch)||batch<1||batch>256)throw new Error('推論設定が不正です');
 const weightBytes=d.total*bits/8;const kvBytes=2*d.layers*d.hidden*context*batch*b.kvBytesPerElement*(d.attention==='grouped'?.25:1);const reservedBytes=weightBytes*b.reserveFactor;
 const tokensPerSecond=c.peakFlops*b.efficiency*c.network*c.cooling*b.inferenceUtilization/(2*d.active*(1+context/8192*b.attentionOverhead))*b.quantSpeed[bits]*Math.min(2,Math.sqrt(batch));
 return{weightBytes,kvBytes,reservedBytes,memoryBytes:weightBytes+kvBytes+reservedBytes,tokensPerSecond,qualityPenalty:b.quantPenalty[bits]};
}
