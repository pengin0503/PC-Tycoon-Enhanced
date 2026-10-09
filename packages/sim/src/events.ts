import {marketEvents,eventBalance} from '../../content/src/events';
import {nextRandom} from './random';
import {logEvent,expense} from './finance';
import type {GameState,GameCommand} from './types';
export function marketDaily(s:GameState){if(s.modifiers.expiresDay>0&&s.modifiers.expiresDay<=s.day)s.modifiers={demand:1,production:1,expiresDay:0};}
export function marketMonthly(s:GameState){
 if(s.pendingDecision)return;
 const [chance,seed]=nextRandom(s.seed);s.seed=seed;
 if(chance>=eventBalance.monthlyChance)return;
 const [choice,next]=nextRandom(s.seed);s.seed=next;
 if(choice<.5){
  const id=choice<.25?'supply-boost':'demand-campaign';
  s.pendingDecision=id==='supply-boost'
   ?{id,title:'追加生産契約',description:`${eventBalance.supplyBoostCost.toLocaleString('ja-JP')}円を支払い、30日間の生産能力を10%増加しますか？`,cost:eventBalance.supplyBoostCost}
   :{id,title:'市場認知度キャンペーン',description:`${eventBalance.demandCampaignCost.toLocaleString('ja-JP')}円を支払い、30日間の需要を10%増加しますか？`,cost:eventBalance.demandCampaignCost};
  logEvent(s,'decisionPending',s.pendingDecision.title);
  return;
 }
 const event=marketEvents[Math.floor((choice-.5)*2*marketEvents.length)];
 s.modifiers={demand:event.demand,production:event.production,expiresDay:s.day+eventBalance.durationDays};
 logEvent(s,'marketEvent',event.label);
}
export function eventCommand(s:GameState,c:GameCommand):boolean{
 if(c.type!=='eventDecision')return false;
 const pending=s.pendingDecision;
 if(!pending)throw new Error('回答待ちのイベントはありません');
 if(c.choice==='invest'){
  expense(s,pending.cost);
  if(pending.id==='supply-boost')s.modifiers.production=Math.min(1.5,s.modifiers.production*1.1);
  else {s.modifiers.demand=Math.min(1.5,s.modifiers.demand*1.1);s.company.awareness=Math.min(100,s.company.awareness+2);}
  s.modifiers.expiresDay=s.day+eventBalance.durationDays;
  logEvent(s,'eventDecision',pending.title+'：投資');
 }else logEvent(s,'eventDecision',pending.title+'：見送り');
 s.pendingDecision=null;
 return true;
}
