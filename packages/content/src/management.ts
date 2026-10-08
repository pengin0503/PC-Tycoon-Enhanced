export const offices=Array.from({length:10},(_,i)=>({level:i+1,label:['ガレージ','共同オフィス','小型ラボ','開発フロア','技術センター','企業キャンパス','研究都市','グローバル本部','先端技術パーク','未来産業拠点'][i],staffCapacity:4*(i+1),researchSlots:1+Math.floor(i/2),monthlyCost:Math.round(12000*(i+1)**1.3),upgradeCost:Math.round(50000*(i+1)**1.8)}));
export const managementBalance={maxFactoryLevel:13,factoryUpgrade:30000,factoryExponent:1.7,factoryMonthly:1000,recruitPerSkill:50,salaryPerSkill:30,trainingCost:2000,trainingGain:10,workPerSkill:.1,advertisingAwareness:30,awarenessDecay:.99,normalLoanCap:200000,hardLoanCap:100000,normalInterest:.01,hardInterest:.02,hardResearchCost:1.3,historyLimit:240,marketingSkillScale:100,advertisingReputation:.1,officeValue:30000,reputationValue:2000,revenueValue:.2};
export const rivalTemplates=[{id:'r-1',name:'Vertex Works',focus:'cpu' as const},{id:'r-2',name:'Lumen Circuit',focus:'gpu' as const},{id:'r-3',name:'Cobalt Memory',focus:'ram' as const}];
export const rivalBalance={initialCash:200000,researchCost:4000,designCost:3000,monthlyCost:6000,work:10,hardEfficiency:1.5,capacity:12,inventoryTarget:100,valuationBase:100000,valuationPerTech:30000,pressure:.15,maxResearch:20,playerPressure:.2,demandFloor:.9,demandVariance:.2,priceCostMultiple:2,generationPerformance:.08,developmentWork:20,priceUndercut:.9,minimumPriceCostMultiple:1.2};
export const researchPointBalance={initial:100,pointsPerWork:10,officeBonus:.1,costPerWork:10} as const;
export const distributionBalance={maxLevel:10,upgradeCost:40000,upgradeExponent:1.8,monthlyCost:2500,demandPerLevel:.06,fansPerLevel:15} as const;
export const distributionLabels=['販売店なし','地域の取扱店','専門店コーナー','家電量販店','全国チェーン','直営ショップ','オンラインストア','海外代理店','グローバル流通網','旗艦店ネットワーク','世界直販体制'];
export const offerBalance={monthlyChance:.35,maxOffers:5,expiryDays:14,minShare:.3,shareRange:.5,minPrice:.85,priceRange:.15,counterLimit:25} as const;
export const offerBuyers=['Northwind 教育委員会','Helix 物流','Maple 銀行','Orbit ゲームカフェ','Sakura 市役所','Atlas データセンター','Quill 出版','Nimbus 大学'];
export const acquisitionBalance={minimumRatio:.7,floorChance:.1,cooldownDays:30} as const;
export const staffTraits=['genius','efficient','charismatic','frugal','ai-specialist'] as const;
export type StaffTrait=typeof staffTraits[number];
export const staffTraitLabels:Record<StaffTrait,string>={genius:'天才',efficient:'効率家',charismatic:'カリスマ',frugal:'倹約家','ai-specialist':'AI専門'};
export const staffTraitDescriptions:Record<StaffTrait,string>={genius:'担当業務の成果 ×1.5',efficient:'担当業務の成果 ×1.25',charismatic:'広告効果とファン獲得 ×2',frugal:'給与 ×0.8','ai-specialist':'AI業務 ×1.5、その他 ×1.1'};
export const hrBalance={severanceMonths:3,candidateCount:3,maxCandidates:6,frugalSalary:.8,
 searches:{free:{cost:0,minSkill:25,skillRange:40,traitChance:.2},standard:{cost:5000,minSkill:50,skillRange:35,traitChance:.6},premium:{cost:20000,minSkill:70,skillRange:30,traitChance:1}}} as const;
