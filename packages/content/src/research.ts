export const hardwareKinds=['cpu','gpu','motherboard','ram','storage','monitor','psu'] as const;
export type HardwareKind=typeof hardwareKinds[number];
/**
 * `branch`: what one branch of research improves. Every branch improves exactly one thing: a design slider
 * (`slider`), the choices of one option field (`option`), one direct AI bonus (`effect`) or one OS feature (`feature`).
 * `foundation` (`<category>-compute-1`) unlocks a product category; `visual` unlocks appearance grades.
 */
export type TechKind='foundation'|'slider'|'option'|'effect'|'feature'|'visual';
export type Tech={id:string,label:string,category:string,axis:string,level:number,generation:number,cost:number,work:number,prerequisites:string[],effect:number,kind:TechKind,branchLabel:string};
export const researchDomains=[...hardwareKinds,'pc','laptop','os','ai'];
export const visualKinds=[...hardwareKinds,'pc','laptop'] as const;
/** Research axes before every branch was tied to one specification (economy version 3 and older saves). */
export const legacyResearchAxes=['compute','power','cost','reliability','capacity','compatibility'];
/** AI branches with a direct effect; `compute` stage 1 is the AI foundation. */
export const aiResearchAxes=['compute','architecture','quantization','data','context','economics'];
export const axisLabels:Record<string,string>={compute:'演算効率',architecture:'経路・構造設計',quantization:'量子化精度維持',data:'データ整備',context:'Attention効率',economics:'サービス運用効率',visual:'製品の外観・意匠'};
export const researchBalance={cost:4000,costExponent:1.3,work:10,workExponent:1.2,diminishing:.02,
 effects:{compute:.08,architecture:.12,quantization:.12,data:.1,context:.12,economics:.1} as Record<string,number>};
/** Stages from year-2000 to year-2100 technology: stage N is technology year 2000 + 2·N. */
export const researchLevels=50;
/**
 * Stages of a hardware slider branch including the advanced tier: stages 51–100 continue from year-2100 to year-2200
 * technology, widening each slider from its year-2100 bound (`unlock.base`) to its final bound.
 */
export const maxResearchLevels=100;
/** Highest research share (`level / researchLevels`): 1 is year-2100 technology, 2 is year-2200 technology. */
export const maxResearchShare=maxResearchLevels/researchLevels;
