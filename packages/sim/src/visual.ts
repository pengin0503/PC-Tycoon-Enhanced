import {unlockedVisualTier} from '../../content/src/research';
export type VisualChoice={tier:number,color:'graphite'|'silver'|'teal'};
export const visualBalance={finishCostPerTier:8,demandPerTier:.02} as const;
export function validateVisual(completed:string[],kind:string,choice?:VisualChoice):number{
 if(!choice)return 0;
 if(!Number.isInteger(choice.tier)||choice.tier<0||choice.tier>5||!['graphite','silver','teal'].includes(choice.color))throw new Error('外観の仕様が不正です');
 if(choice.tier>unlockedVisualTier(completed,kind))throw new Error('外観研究を完了してください');
 return choice.tier;
}
export function visualFinishCost(tier:number){return visualBalance.finishCostPerTier*tier;}
export function visualDemandFactor(tier:number){return 1+Math.min(5,Math.max(0,tier))*visualBalance.demandPerTier;}
