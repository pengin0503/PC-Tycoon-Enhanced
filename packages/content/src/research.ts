export const hardwareKinds=['cpu','gpu','motherboard','ram','storage'] as const;
export type HardwareKind=typeof hardwareKinds[number];
export type Tech={id:string,label:string,category:string,axis:string,level:number,cost:number,work:number,prerequisites:string[],effect:number};
export const techCatalog:Tech[]=hardwareKinds.flatMap(category=>Array.from({length:3},(_,i)=>({
 id:`${category}-compute-${i+1}`,label:`${category.toUpperCase()} 基盤技術 ${i+1}`,category,axis:'compute',level:i+1,
 cost:4000*(i+1),work:10*(i+1),prerequisites:i?[`${category}-compute-${i}`]:[],effect:0.08,
})));
export const techById=new Map(techCatalog.map(t=>[t.id,t]));
export function techEffect(completed:string[],category:string,axis:string){return completed.reduce((n,id)=>{const t=techById.get(id);return n+(t?.category===category&&t.axis===axis?t.effect:0);},0);}
