import {benchmarkGames,benchmarkPresets,benchmarkBalance as b,type BenchmarkPreset} from '../../content/src/market';
import {findPart,deviceParts} from './devices';
import {osRequirements,meetsOSRequirements} from './os';
import type {GameState,Product} from './types';

export type DeviceBenchmark={cpu:number,gpu:number,memory:number,storage:number,overall:number,osPenalty:boolean,
 games:{id:string,name:string,genre:string,fps:Record<BenchmarkPreset,number>,playable:boolean}[]};

/** Fictional benchmark suite for an assembled PC/laptop (game units only). */
export function benchmarkDevice(s:GameState,p:Product):DeviceBenchmark{
 if(p.kind!=='pc'&&p.kind!=='laptop')throw new Error('完成PCまたはノートPCを選択してください');
 const parts=deviceParts(p.spec);
 const perf=(k:string,ref:number)=>(findPart(s,parts[k as keyof typeof parts],true)?.performance??0)/ref;
 const cpu=perf('cpu',b.cpuReference),gpu=perf('gpu',b.gpuReference),memory=perf('ram',b.ramReference),storage=perf('storage',b.storageReference);
 const os=p.spec.osId?s.products.find(o=>o.id===p.spec.osId&&o.kind==='os'):undefined;
 const osPenalty=!!os&&!meetsOSRequirements(s,p.spec,osRequirements(os));
 const laptop=p.kind==='laptop'?b.laptopFactor:1;
 const penalty=osPenalty?.75:1;
 const scale=(x:number)=>Math.round(x*b.scoreScale*laptop*penalty);
 const games=benchmarkGames.map(g=>{
  const power=cpu**g.cpuWeight*gpu**g.gpuWeight*Math.min(1,.6+.4*Math.min(memory,storage));
  const fps=Object.fromEntries(Object.entries(benchmarkPresets).map(([k,v])=>[k,Math.min(b.fpsCap,Math.round(g.baseFps*power*laptop*penalty/v.load))])) as Record<BenchmarkPreset,number>;
  return {id:g.id,name:g.name,genre:g.genre,fps,playable:fps.high>=30&&p.performance>=g.minScore};
 });
 return {cpu:scale(cpu),gpu:scale(gpu),memory:scale(memory),storage:scale(storage),overall:p.performance,osPenalty,games};
}

/** Single-number score for any component or device so reviews and charts can compare across kinds. */
export function benchmarkScore(p:Pick<Product,'kind'|'performance'>):number{return Math.round(p.performance);}
