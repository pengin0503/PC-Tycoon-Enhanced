import {tieredAchievements,milestoneAchievements,hardModeGoal,type TieredMetric} from '../../content/src/achievements';
import {productKinds} from '../../content/src/devices';
import {offices,managementBalance,distributionBalance} from '../../content/src/management';
import {companyValue} from './management';
import {logEvent} from './finance';
import type {GameState,GameCommand} from './types';

export type CompanyStats=Record<TieredMetric,number>;
/** Revenue over the last 360 days from monthly history (whole history before the first year). */
export function yearRevenue(s:GameState){
 const past=s.history.filter(h=>h.day<=s.day-360).at(-1);
 return s.finance.revenue-(past?.revenue??0);
}
export function companyStats(s:GameState):CompanyStats{
 return {earned:s.finance.revenue,cash:s.company.cash,sold:s.products.reduce((n,p)=>n+p.sold,0),fans:s.company.fans,
  yearRevenue:yearRevenue(s),companyValue:companyValue(s),research:s.research.completed.length};
}
function milestones(s:GameState):Record<typeof milestoneAchievements[number]['id'],boolean>{
 const launched=new Set(s.products.filter(p=>p.launched).map(p=>p.kind));
 return {
  'first-launch':launched.size>0,
  'five-stars':s.products.some(p=>(p.review?.stars??0)>=5),
  'all-kinds':productKinds.every(k=>launched.has(k)),
  'office-max':s.officeLevel>=offices.length,
  'factory-max':s.factoryLevel>=managementBalance.maxFactoryLevel,
  'distribution-max':s.distributionLevel>=distributionBalance.maxLevel,
  'all-companies':s.rivals.length>0&&s.rivals.every(r=>r.acquired),
  'mass-production':s.products.some(p=>p.sold+p.inventory>=1000),
  'ai-model':s.models.some(m=>m.status==='ready'),
  'hard-mode':s.difficulty==='hard'&&companyValue(s)>=hardModeGoal,
 };
}
/** Unlocks are permanent and recorded with their day; sandbox games never earn achievements. */
export function checkAchievements(s:GameState){
 if(s.mode==='sandbox')return;
 const have=new Set(s.achievements.map(a=>a.id));const stats=companyStats(s);
 const unlock=(id:string)=>{if(have.has(id))return;have.add(id);s.achievements.push({id,day:s.day});logEvent(s,'achievement',id);};
 for(const t of tieredAchievements)t.tiers.forEach((v,i)=>{if(stats[t.metric]>=v)unlock(`${t.metric}-${i+1}`);});
 for(const [id,ok] of Object.entries(milestones(s)))if(ok)unlock(id);
}
/** Hard difficulty: unpaid monthly costs end the company. */
export function checkGameOver(s:GameState){
 if(s.difficulty!=='hard'||s.gameOver||s.company.debt<=0)return;
 s.gameOver={day:s.day,reason:'月次費用を支払えず倒産しました'};logEvent(s,'gameOver',s.gameOver.reason);
}
export function progressCommand(s:GameState,c:GameCommand):boolean{
 switch(c.type){
  case'rename':s.company.name=c.name;logEvent(s,'renamed',c.name);return true;
  case'logo':s.company.logo=c.logo;return true;
  case'sandbox':
   if(s.mode!=='sandbox')throw new Error('サンドボックスモード専用の操作です');
   if(c.cash!==undefined){s.company.cash=c.cash;s.company.debt=0;}
   if(c.researchPoints!==undefined)s.company.researchPoints=c.researchPoints;
   if(c.fans!==undefined)s.company.fans=c.fans;
   return true;
  default:return false;
 }
}
