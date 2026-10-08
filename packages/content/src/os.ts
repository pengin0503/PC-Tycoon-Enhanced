// OS features, requirements, lock screens and security incidents. Fictional gameplay values.
export const osFeatures=['files','calculator','browser','security','media','games','store'] as const;
export type OSFeature=typeof osFeatures[number];
export const osFeatureLabels:Record<OSFeature,string>={files:'ファイル',calculator:'電卓',browser:'ブラウザ',security:'セキュリティ',media:'メディアプレーヤー',games:'ゲーム',store:'アプリストア'};
/** Features beyond the original three need their OS research stage. */
export const osFeatureResearch:Partial<Record<OSFeature,string>>={security:'os-reliability-1',media:'os-capacity-1',games:'os-compute-2',store:'os-compatibility-1'};
export const lockScreens=['aurora','grid','dunes','nebula'] as const;
export const lockScreenLabels:Record<typeof lockScreens[number],string>={aurora:'オーロラ',grid:'グリッド',dunes:'砂丘',nebula:'星雲'};
export const osThemes=['teal','blue','orange','violet'] as const;
export const osBalance={
 requirements:{cpuBase:400,cpuPerFeature:150,cpuPerVersion:50,ramBase:2,ramPerFeature:2,storageBase:32,storagePerFeature:16,storagePerVersion:8},
 unmetPerformance:.75,
 featureDemand:.04,
 attack:{monthlyChance:.2,deadlineDays:7,targets:12,reputationLoss:6,fanLoss:.08,demandPenalty:.3,penaltyDays:30,securityReduction:.5,supportReduction:.3},
} as const;
