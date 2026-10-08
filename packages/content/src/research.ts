export const hardwareKinds=['cpu','gpu','motherboard','ram','storage','monitor'] as const;
export type HardwareKind=typeof hardwareKinds[number];
export type Tech={id:string,label:string,category:string,axis:string,level:number,generation:number,cost:number,work:number,prerequisites:string[],effect:number};
export const researchDomains=[...hardwareKinds,'pc','laptop','os','ai'];
export const researchAxes=['compute','power','cost','reliability','capacity','compatibility'];
export const aiResearchAxes=['compute','architecture','quantization','data','context','economics'];
export const axisLabels:Record<string,string>={compute:'演算・処理設計',power:'省電力設計',cost:'歩留まりと原価',reliability:'信頼性検証',capacity:'設計密度と容量',compatibility:'接続・互換規格',architecture:'経路・構造設計',quantization:'量子化精度維持',data:'データ整備',context:'Attention効率',economics:'サービス運用効率'};
export const researchBalance={cost:4000,costExponent:1.3,work:10,workExponent:1.2,diminishing:.02,
 effects:{compute:.08,power:.12,cost:.1,reliability:.08,capacity:.2,compatibility:.04,architecture:.12,quantization:.12,data:.1,context:.12,economics:.1} as Record<string,number>};
const stages=['基礎設計','検証改良','統合実証','効率最適化','量産・実用化'];
export const techCatalog:Tech[]=researchDomains.flatMap(category=>(category==='ai'?aiResearchAxes:researchAxes).flatMap(axis=>Array.from({length:50},(_,i)=>{
 const level=i+1,generation=1+Math.floor(i/5);let label=`${category.toUpperCase()} 第${generation}世代 ${axisLabels[axis]} ${stages[i%5]}`;
 if(level===1&&axis==='compute')label=`${category.toUpperCase()} 基盤技術 1`;
 if(category==='ai'&&axis==='architecture'&&level===1)label='AI MoE設計';if(category==='ai'&&axis==='quantization'&&level===1)label='AI 量子化';
 return{id:`${category}-${axis}-${level}`,label,category,axis,level,generation,cost:Math.round(researchBalance.cost*level**researchBalance.costExponent),work:researchBalance.work*level**researchBalance.workExponent,
 prerequisites:[...(i?[`${category}-${axis}-${i}`]:[]),...(axis!=='compute'?[`${category}-compute-${Math.ceil(level/5)}`]:[])],effect:researchBalance.effects[axis]/(1+i*researchBalance.diminishing)};
})));
export const techById=new Map(techCatalog.map(t=>[t.id,t]));
export function techEffect(completed:string[],category:string,axis:string){return completed.reduce((n,id)=>{const t=techById.get(id);return n+(t?.category===category&&t.axis===axis?t.effect:0);},0);}
