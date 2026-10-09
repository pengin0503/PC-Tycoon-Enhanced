export const marketEvents=[{id:'upgrade-cycle',label:'企業向け更新需要が増加',demand:1.05,production:1},{id:'supply-delay',label:'部材供給に小さな遅延',demand:1,production:.95},{id:'purchase-pause',label:'買い替え需要が一時的に減少',demand:.95,production:1},{id:'factory-learning',label:'製造工程の習熟が進展',demand:1,production:1.05}];
export const eventBalance={monthlyChance:.25,durationDays:30,supplyBoostCost:20000000,demandCampaignCost:25000000};

/** Historical sector shocks; affected categories are gameplay coefficients, not empirical sales estimates. */
export const eraMarketEvents=[
 {year:2001,label:'ドットコムバブル崩壊',until:2003,affected:{pc:.7,laptop:.8,cpu:.83,gpu:.85,motherboard:.82,ram:.83,storage:.88} as Record<string,number>},
 {year:2007,label:'スマートフォン時代の到来',affected:{laptop:1.22,ram:1.14,storage:1.14,monitor:.95,pc:.9} as Record<string,number>},
 {year:2022,label:'生成AIブーム',affected:{gpu:1.4,ram:1.24,storage:1.2,pc:1.12,cpu:1.15} as Record<string,number>},
] as const;
