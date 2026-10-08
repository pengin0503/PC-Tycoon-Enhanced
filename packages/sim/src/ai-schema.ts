import {z} from 'zod';
import {aiBalance as b} from '../../content/src/ai';
export const designSchema=z.object({architecture:z.enum(['dense','moe']),total:z.number().int().min(1e6).max(1e12),active:z.number().int().min(1e6).max(1e12),layers:z.number().int().min(1).max(256),hidden:z.number().int().min(128).max(32768).refine(n=>n%128===0),attention:z.enum(['standard','grouped']),context:z.number().int().min(128).max(1048576),tokens:z.number().int().min(1e6).max(1e13),quality:z.number().min(.1).max(1),diversity:z.number().min(.1).max(1)}).strict().superRefine((d,ctx)=>{
 if(d.architecture==='dense'&&d.total!==d.active||d.active>d.total||d.total/d.active>64)ctx.addIssue({code:'custom',message:'Dense/MoEの稼働パラメータが不正です'});
 const core=d.layers*d.hidden**2;if(d.active<core*b.shapeLower||d.active>core*b.shapeUpper+d.hidden*b.vocabulary)ctx.addIssue({code:'custom',message:'層数・hidden sizeと稼働パラメータ数が整合しません'});
});
export const clusterSchema=z.object({id:z.string(),gpuId:z.string(),serverId:z.string(),gpus:z.number().int().min(1).max(256),peakFlops:z.number().positive(),vramBytes:z.number().positive(),powerWatts:z.number().positive(),network:z.number().min(.1).max(1),cooling:z.number().min(.1).max(1),purchaseCost:z.number().int().nonnegative().max(1e12)}).strict();
export type LLMDesign=z.infer<typeof designSchema>;
export type ComputeCluster=z.infer<typeof clusterSchema>;
