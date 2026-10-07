import {offices,managementBalance as b} from '../../content/src/management';
import {expense,logEvent} from './finance';
import {osMonthlyCost} from './devices';
import type {GameState,GameCommand} from './types';
export function workBonus(s:GameState,role:'research'|'engineering'|'ai'){return s.staff.filter(e=>e.role===role).reduce((n,e)=>n+e.skill*b.workPerSkill,0);}
export function managementCommand(s:GameState,c:GameCommand):boolean{
 switch(c.type){
  case'office':if(c.level!==s.officeLevel+1)throw new Error('次のオフィス段階を選択してください');expense(s,offices[c.level-1].upgradeCost,false,true);s.officeLevel=c.level;logEvent(s,'officeUpgrade',offices[c.level-1].label);return true;
  case'factory':if(c.level!==s.factoryLevel+1)throw new Error('次の工場段階を選択してください');expense(s,Math.round(b.factoryUpgrade*c.level**b.factoryExponent),false,true);s.factoryLevel=c.level;return true;
  case'hire':if(s.staff.length>=offices[s.officeLevel-1].staffCapacity)throw new Error('オフィスの人員枠が不足しています');expense(s,c.skill*b.recruitPerSkill);s.staff.push({id:`e-${s.staff.length+1}`,role:c.role,skill:c.skill,salary:c.skill*b.salaryPerSkill});logEvent(s,'hired',c.role);return true;
  case'train':{const e=s.staff.find(e=>e.id===c.id);if(!e||e.skill>=100)throw new Error('育成対象を確認してください');expense(s,b.trainingCost);e.skill=Math.min(100,e.skill+b.trainingGain);e.salary=e.skill*b.salaryPerSkill;return true;}
  case'marketing':s.advertising=c.budget;return true;
  case'borrow':{const cap=s.difficulty==='hard'?b.hardLoanCap:b.normalLoanCap;if(s.company.loan+c.amount>cap)throw new Error('借入枠を超えています');s.company.loan+=c.amount;const overdue=Math.min(c.amount,s.company.debt);s.company.debt-=overdue;s.company.cash+=c.amount-overdue;return true;}
  case'repay':if(c.amount>s.company.loan||c.amount>s.company.cash)throw new Error('返済額を確認してください');s.company.cash-=c.amount;s.company.loan-=c.amount;return true;
  default:return false;
 }
}
export function marketingWeek(s:GameState){
 s.company.awareness*=b.awarenessDecay;
 if(s.advertising){if(s.company.cash<s.advertising||s.company.debt>0){s.advertising=0;logEvent(s,'marketingStopped');}else{expense(s,s.advertising);const staff=s.staff.filter(e=>e.role==='marketing').reduce((n,e)=>n+e.skill,0);s.company.awareness=Math.min(100,s.company.awareness+Math.sqrt(s.advertising)/b.advertisingAwareness*(1+staff/100));s.company.reputation=Math.min(100,s.company.reputation+.1);}}
}
export function monthlyCosts(s:GameState){return offices[s.officeLevel-1].monthlyCost+(s.factoryLevel-1)*b.factoryMonthly+s.staff.reduce((n,e)=>n+e.salary,0)+osMonthlyCost(s)+Math.round(s.company.loan*(s.difficulty==='hard'?b.hardInterest:b.normalInterest));}
export function monthlyHistory(s:GameState,share=0){s.history.push({day:s.day,cash:s.company.cash,debt:s.company.debt,loan:s.company.loan,...s.finance,share});s.history=s.history.slice(-b.historyLimit);}
export function companyValue(s:GameState){return Math.max(0,Math.round(s.company.cash-s.company.debt-s.company.loan+s.products.reduce((n,p)=>n+p.inventory*p.unitCost,0)+s.officeLevel*30000+s.company.reputation*2000+s.finance.revenue*.2));}
