import {it,expect} from 'vitest';
import * as raw from '../packages/sim/src/ai-math';
const api=raw as any;
export const design={architecture:'dense',total:1e9,active:1e9,layers:24,hidden:2048,attention:'standard',context:4096,tokens:1e9,quality:.8,diversity:.8};
export const cluster={id:'c',gpuId:'v-ai-workstation',serverId:'vendor',gpus:1,peakFlops:2e14,vramBytes:48e9,powerWatts:350,network:.8,cooling:.9,purchaseCost:20000};
it('computes literal training work and memory terms',()=>{
 expect(api.estimateLLM).toBeTypeOf('function');const train=api.estimateLLM(design,cluster);expect(train.trainingFlops).toBe(6e18);expect(train.cost).toBeGreaterThan(0);
 const inference=api.estimateInference(design,cluster,16,4096,1);expect(inference.weightBytes).toBe(2e9);expect(inference.kvBytes).toBe(805306368);expect(inference.memoryBytes).toBeGreaterThan(inference.weightBytes+inference.kvBytes);
});
it('MoE active work differs from total memory and quantization has a cost',()=>{
 const moe={...design,architecture:'moe',total:8e9};expect(api.estimateLLM(moe,cluster).trainingFlops).toBe(6e18);
 const a=api.estimateInference(moe,cluster,16,4096,1),b=api.estimateInference(moe,cluster,4,4096,1);
 expect(a.weightBytes).toBe(16e9);expect(b.memoryBytes).toBeLessThan(a.memoryBytes);expect(b.tokensPerSecond).toBeGreaterThan(a.tokensPerSecond);expect(b.qualityPenalty).toBeGreaterThan(a.qualityPenalty);
});
it.each([{active:2e9},{architecture:'moe',total:1e8},{tokens:-1},{total:Infinity},{layers:0},{hidden:1},{quality:2}])('rejects invalid model configuration %j',change=>expect(()=>api.estimateLLM({...design,...change},cluster)).toThrow());
it('additional cluster compute lowers estimated training time',()=>{
 const a=api.estimateLLM(design,cluster),b=api.estimateLLM(design,{...cluster,gpus:2,peakFlops:4e14,vramBytes:96e9});expect(b.seconds).toBeLessThan(a.seconds);
});
