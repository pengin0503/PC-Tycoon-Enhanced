/**
 * Offices at real-world rents (yen per month, utilities included): a garage, then rented floors in Tokyo, then owned
 * campuses. Moving in costs about ten months of the new rent (deposit, interior, equipment).
 */
const officeRents=[200000,600000,1500000,3000000,5000000,8000000,12000000,18000000,25000000,35000000];
export const offices=Array.from({length:10},(_,i)=>({level:i+1,label:['ガレージ','共同オフィス','小型ラボ','開発フロア','技術センター','企業キャンパス','研究都市','グローバル本部','先端技術パーク','未来産業拠点'][i],staffCapacity:4*(i+1),researchSlots:1+Math.floor(i/2),monthlyCost:officeRents[i],upgradeCost:officeRents[i]*10}));
/**
 * Money in yen at real-world scale. Monthly salary is `salaryBase + skill × salaryPerSkill` (skill 50 ≈ ¥450,000, a
 * mid-career engineer's cost to the company); hiring pays an agency fee of about 30% of a year's salary. Awareness grows
 * with the square root of the weekly budget, so `advertisingAwareness` is scaled by √100 with the ×100 economy.
 */
export const managementBalance={maxFactoryLevel:13,factoryUpgrade:30000000,factoryExponent:1.7,factoryMonthly:2000000,recruitPerSkill:30000,salaryBase:200000,salaryPerSkill:5000,trainingCost:300000,trainingGain:10,workPerSkill:.1,advertisingAwareness:300,awarenessDecay:.99,normalLoanCap:500000000,hardLoanCap:250000000,normalInterest:.01,hardInterest:.02,hardResearchCost:1.3,historyLimit:240,marketingSkillScale:100,advertisingReputation:.1,officeValue:30000000,reputationValue:10000000,revenueValue:.2};
export const rivalTemplates=[
 {id:'r-1',name:'Vertex Works',focus:'cpu'},
 {id:'r-2',name:'Lumen Circuit',focus:'gpu'},
 {id:'r-3',name:'Cobalt Memory',focus:'ram'},
 {id:'r-4',name:'Ironbridge Silicon',focus:'cpu'},
 {id:'r-5',name:'Prism Graphics',focus:'gpu'},
 {id:'r-6',name:'Keystone Boards',focus:'motherboard'},
 {id:'r-7',name:'Harbor Storage',focus:'storage'},
 {id:'r-8',name:'Aster Power',focus:'psu'},
 {id:'r-9',name:'Clearview Display',focus:'monitor'},
] as const;
/** Rivals pay the same design cost as the player for their focus (`hardwareCatalog[focus].designCost`). */
export const rivalBalance={initialCash:2000000000,researchCost:50000000,monthlyCost:15000000,work:10,levelWeeks:100,hardEfficiency:1.5,longEfficiency:.7,capacity:120,inventoryTarget:1000,valuationBase:3000000000,valuationPerTech:300000000,pressure:.15,maxResearch:50,playerPressure:.2,demandFloor:.9,demandVariance:.2,priceCostMultiple:2,developmentWork:20,priceUndercut:.9,minimumPriceCostMultiple:1.2};
export const researchPointBalance={initial:100,pointsPerWork:3,officeBonus:.1,costPerWork:10} as const;
export const distributionBalance={maxLevel:10,upgradeCost:20000000,upgradeExponent:1.8,monthlyCost:2000000,demandPerLevel:.06,fansPerLevel:15} as const;
export const distributionLabels=['販売店なし','地域の取扱店','専門店コーナー','家電量販店','全国チェーン','直営ショップ','オンラインストア','海外代理店','グローバル流通網','旗艦店ネットワーク','世界直販体制'];
export const offerBalance={monthlyChance:.35,maxOffers:5,expiryDays:14,minShare:.3,shareRange:.5,minPrice:.85,priceRange:.15,counterLimit:25} as const;
export const offerBuyers=['Northwind 教育委員会','Helix 物流','Maple 銀行','Orbit ゲームカフェ','Sakura 市役所','Atlas データセンター','Quill 出版','Nimbus 大学'];
export const acquisitionBalance={minimumRatio:.7,floorChance:.1,cooldownDays:30} as const;
export const staffTraits=['genius','efficient','charismatic','frugal','ai-specialist'] as const;
export type StaffTrait=typeof staffTraits[number];
export const staffTraitLabels:Record<StaffTrait,string>={genius:'天才',efficient:'効率家',charismatic:'カリスマ',frugal:'倹約家','ai-specialist':'AI専門'};
export const staffTraitDescriptions:Record<StaffTrait,string>={genius:'担当業務の成果 ×1.5',efficient:'担当業務の成果 ×1.25',charismatic:'広告効果とファン獲得 ×2',frugal:'給与 ×0.8','ai-specialist':'AI業務 ×1.5、その他 ×1.1'};
export const hrBalance={severanceMonths:3,candidateCount:3,maxCandidates:6,frugalSalary:.8,
 searches:{free:{cost:0,minSkill:25,skillRange:40,traitChance:.2},standard:{cost:1000000,minSkill:50,skillRange:35,traitChance:.6},premium:{cost:3000000,minSkill:70,skillRange:30,traitChance:1}}} as const;
