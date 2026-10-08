import {distributionBalance as d,offerBalance as o,offerBuyers,acquisitionBalance as a,hrBalance as h,staffTraits,managementBalance,researchPointBalance as rp,offices,type StaffTrait} from '../../content/src/management';
import {techById} from '../../content/src/research';
import {expense,income,logEvent} from './finance';
import {derivedRandom} from './random';
import {removeStock} from './inventory';
import {weeklyFans} from './reception';
import type {GameState,GameCommand} from './types';
type Staff=GameState['staff'][number];
type Role=Staff['role'];

// ---- research points ----
export function researchCostMultiplier(s:GameState){return (s.difficulty==='hard'?managementBalance.hardResearchCost:1)*modeResearchCost(s);}
/** Overridden by game modes (G5); 1 for standard games. */
export function modeResearchCost(s:GameState){return s.mode==='long'?2:s.mode==='tycoon'?.75:1;}
export function researchPointCost(s:GameState,id:string){const t=techById.get(id);if(!t)throw new Error('研究が存在しません');return Math.ceil(t.work*rp.costPerWork*researchCostMultiplier(s));}
export function weeklyResearchPoints(s:GameState,base:number){
 const office=1+rp.officeBonus*(s.officeLevel-1);
 return Math.round((base+traitWork(s,'research'))*rp.pointsPerWork*office);
}

// ---- staff traits ----
export function traitWorkMultiplier(trait:StaffTrait|undefined,role:Role){
 switch(trait){case'genius':return 1.5;case'efficient':return 1.25;case'ai-specialist':return role==='ai'?1.5:1.1;default:return 1;}
}
export function traitWork(s:GameState,role:'research'|'engineering'|'ai'){return s.staff.filter(e=>e.role===role).reduce((n,e)=>n+e.skill*managementBalance.workPerSkill*traitWorkMultiplier(e.trait,role),0);}
export function marketingStrength(s:GameState){return s.staff.filter(e=>e.role==='marketing').reduce((n,e)=>n+e.skill*(e.trait==='charismatic'?2:1),0);}
export function salaryFor(skill:number,trait?:StaffTrait){return Math.round(skill*managementBalance.salaryPerSkill*(trait==='frugal'?h.frugalSalary:1));}
function nextStaffId(s:GameState){s.staffSeq=Math.max(s.staffSeq,s.staff.length)+1;return `e-${s.staffSeq}`;}
function addStaff(s:GameState,role:Role,skill:number,trait?:StaffTrait){
 if(s.staff.length>=offices[s.officeLevel-1].staffCapacity)throw new Error('オフィスの人員枠が不足しています');
 expense(s,skill*managementBalance.recruitPerSkill);
 s.staff.push({id:nextStaffId(s),role,skill,salary:salaryFor(skill,trait),...(trait?{trait}:{})});logEvent(s,'hired',role);
}
const roles:Role[]=['research','engineering','marketing','ai'];
export function generateCandidates(s:GameState,tier:keyof typeof h.searches){
 const cfg=h.searches[tier];s.candidates=[];
 for(let i=0;i<h.candidateCount;i++){
  const salt=s.candidateSeq*7+i;
  const role=roles[Math.floor(derivedRandom(s.initialSeed,s.day,1000+salt)*roles.length)];
  const skill=Math.min(100,cfg.minSkill+Math.floor(derivedRandom(s.initialSeed,s.day,2000+salt)*(cfg.skillRange+1)));
  const trait=derivedRandom(s.initialSeed,s.day,3000+salt)<cfg.traitChance?staffTraits[Math.floor(derivedRandom(s.initialSeed,s.day,4000+salt)*staffTraits.length)]:undefined;
  s.candidateSeq++;s.candidates.push({id:`k-${s.candidateSeq}`,role,skill,...(trait?{trait}:{})});
 }
}

// ---- distribution ----
export function distributionCost(level:number){return Math.round(d.upgradeCost*level**d.upgradeExponent);}
export function distributionDemand(s:GameState){return 1+d.demandPerLevel*s.distributionLevel;}
export function distributionMonthly(s:GameState){return d.monthlyCost*s.distributionLevel;}

// ---- acquisitions ----
export function acquisitionChance(offer:number,value:number){
 const ratio=offer/value;if(ratio>=1)return 1;if(ratio<a.minimumRatio)return 0;
 return a.floorChance+(1-a.floorChance)*((ratio-a.minimumRatio)/(1-a.minimumRatio))**2;
}
/** Returns the price to pay, or null when the owners refuse (cooldown starts). */
export function negotiateAcquisition(s:GameState,r:GameState['rivals'][number],value:number,offer:number|undefined):number|null{
 if(offer===undefined)return value;
 if(r.negotiationDay!==undefined&&s.day<r.negotiationDay)throw new Error(`${r.name}との再交渉は${r.negotiationDay}日目以降です`);
 if(offer<Math.ceil(value*a.minimumRatio))throw new Error(`提示額は評価額の${a.minimumRatio*100}%以上にしてください`);
 const roll=derivedRandom(s.initialSeed,s.day,5000+s.rivals.indexOf(r));
 if(roll<acquisitionChance(offer,value))return Math.min(offer,value);
 r.negotiationDay=s.day+a.cooldownDays;logEvent(s,'acquisitionRejected',r.name);return null;
}

// ---- bulk offers ----
export function offerSuccessChance(markup:number){return Math.max(0,1-markup/o.counterLimit);}
export function offersMonthly(s:GameState){
 if(s.offers.length>=o.maxOffers||derivedRandom(s.initialSeed,s.day,6000)>=o.monthlyChance)return;
 const stocked=s.products.filter(p=>p.launched&&p.kind!=='os'&&p.inventory>0);if(!stocked.length)return;
 const p=stocked[Math.floor(derivedRandom(s.initialSeed,s.day,6001)*stocked.length)];
 const quantity=Math.max(1,Math.round(p.inventory*(o.minShare+derivedRandom(s.initialSeed,s.day,6002)*o.shareRange)));
 const unitPrice=Math.max(1,Math.round(p.price*(o.minPrice+derivedRandom(s.initialSeed,s.day,6003)*o.priceRange)));
 const buyer=offerBuyers[Math.floor(derivedRandom(s.initialSeed,s.day,6004)*offerBuyers.length)];
 s.offerSeq++;s.offers.push({id:s.offerSeq,productId:p.id,buyer,quantity,unitPrice,expiresDay:s.day+o.expiryDays});
 logEvent(s,'offerReceived',`${buyer}: ${p.name} ×${quantity}`);
}
export function expireOffers(s:GameState){s.offers=s.offers.filter(x=>x.expiresDay>s.day);}
function fulfil(s:GameState,offer:GameState['offers'][number],unitPrice:number){
 const p=s.products.find(x=>x.id===offer.productId);if(!p)throw new Error('製品が存在しません');
 if(p.inventory<offer.quantity)throw new Error('在庫が不足しています');
 const cost=removeStock(p,offer.quantity);const revenue=offer.quantity*unitPrice;
 p.sold+=offer.quantity;p.revenue+=revenue;p.profit+=revenue-cost;income(s,revenue);weeklyFans(s,p,offer.quantity);
 logEvent(s,'offerAccepted',`${offer.buyer}: ${p.name} ×${offer.quantity} @${unitPrice}`);
}

export function businessCommand(s:GameState,c:GameCommand):boolean{
 switch(c.type){
  case'distribution':
   if(c.level!==s.distributionLevel+1)throw new Error('次の販売網段階を選択してください');
   expense(s,distributionCost(c.level),false,true);s.distributionLevel=c.level;logEvent(s,'distributionUpgrade',String(c.level));return true;
  case'respondOffer':{
   const offer=s.offers.find(x=>x.id===c.id);if(!offer)throw new Error('取引の打診が見つかりません');
   if(c.action==='accept')fulfil(s,offer,offer.unitPrice);
   else if(c.action==='counter'){
    if(!c.markup)throw new Error('上乗せ率を指定してください');
    const p=s.products.find(x=>x.id===offer.productId);if(!p||p.inventory<offer.quantity)throw new Error('在庫が不足しています');
    if(derivedRandom(s.initialSeed,s.day,7000+offer.id)<offerSuccessChance(c.markup))fulfil(s,offer,Math.round(offer.unitPrice*(1+c.markup/100)));
    else logEvent(s,'offerRejected',offer.buyer);
   }else logEvent(s,'offerDeclined',offer.buyer);
   s.offers=s.offers.filter(x=>x.id!==offer.id);return true;
  }
  case'hireCandidate':{
   const k=s.candidates.find(x=>x.id===c.id);if(!k)throw new Error('候補者が見つかりません');
   addStaff(s,k.role,k.skill,k.trait);s.candidates=s.candidates.filter(x=>x.id!==c.id);return true;
  }
  case'searchCandidates':expense(s,h.searches[c.tier].cost);generateCandidates(s,c.tier);logEvent(s,'candidateSearch',c.tier);return true;
  case'fire':{
   const e=s.staff.find(x=>x.id===c.id);if(!e)throw new Error('社員が見つかりません');
   expense(s,e.salary*h.severanceMonths);s.staff=s.staff.filter(x=>x.id!==c.id);logEvent(s,'fired',e.role);return true;
  }
  case'hire':addStaff(s,c.role,c.skill);return true;
  default:return false;
 }
}
export function businessWeekly(s:GameState){if(s.distributionLevel)s.company.fans+=d.fansPerLevel*s.distributionLevel;}
export function businessMonthly(s:GameState){offersMonthly(s);generateCandidates(s,'free');}
