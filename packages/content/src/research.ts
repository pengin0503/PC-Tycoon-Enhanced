export const hardwareKinds=['cpu','gpu','motherboard','ram','storage','monitor'] as const;
export type HardwareKind=typeof hardwareKinds[number];
export type Tech={id:string,label:string,category:string,axis:string,level:number,cost:number,work:number,prerequisites:string[],effect:number};
export const techCatalog:Tech[]=[...hardwareKinds,'pc','laptop','os','ai'].flatMap(category=>Array.from({length:3},(_,i)=>({
 id:`${category}-compute-${i+1}`,label:`${category.toUpperCase()} 基盤技術 ${i+1}`,category,axis:'compute',level:i+1,
 cost:4000*(i+1),work:10*(i+1),prerequisites:i?[`${category}-compute-${i}`]:[],effect:0.08,
})));
techCatalog.push(...['architecture','quantization'].map(axis=>({id:`ai-${axis}-1`,label:axis==='architecture'?'AI MoE設計':'AI 量子化',category:'ai',axis,level:1,cost:4000,work:10,prerequisites:['ai-compute-1'],effect:.08})));
export const techById=new Map(techCatalog.map(t=>[t.id,t]));
export function techEffect(completed:string[],category:string,axis:string){return completed.reduce((n,id)=>{const t=techById.get(id);return n+(t?.category===category&&t.axis===axis?t.effect:0);},0);}
