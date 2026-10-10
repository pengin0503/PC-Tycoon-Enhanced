// OS features, requirements, lock screens and security incidents. Fictional gameplay values.
export const osFeatures=['files','calculator','browser','security','media','games','store'] as const;
export type OSFeature=typeof osFeatures[number];
export const osFeatureLabels:Record<OSFeature,string>={files:'ファイル',calculator:'電卓',browser:'ブラウザ',security:'セキュリティ',media:'メディアプレーヤー',games:'ゲーム',store:'アプリストア'};
/** Features beyond the original three each need their own one-stage OS research. */
export const osFeatureResearch:Partial<Record<OSFeature,string>>={security:'os-security-1',media:'os-media-1',games:'os-games-1',store:'os-store-1'};
export const lockScreens=['aurora','grid','dunes','nebula'] as const;
export const lockScreenLabels:Record<typeof lockScreens[number],string>={aurora:'オーロラ',grid:'グリッド',dunes:'砂丘',nebula:'星雲'};
export const osThemes=['teal','blue','orange','violet'] as const;
/** OS design sliders (0..1 game ratios). Each slider's own research branch widens its upper bound. */
export const osSliders={
 quality:{label:'品質',min:.1,max:1,step:.01,default:.8,unlock:{axes:['quality'],from:.8}},
 compatibility:{label:'互換性',min:.1,max:1,step:.01,default:.8,unlock:{axes:['compatibility'],from:.8}},
 support:{label:'サポート',min:0,max:1,step:.01,default:.7,unlock:{axes:['support'],from:.7}},
} as const;
export type OSSlider=keyof typeof osSliders;
export const osBalance={
 /** Year-2000 scale: a three-feature OS asks for 80MB of RAM and 1.35GB of storage (GB values). */
 requirements:{cpuBase:400,cpuPerFeature:150,cpuPerVersion:50,ramBase:.032,ramPerFeature:.016,storageBase:.5,storagePerFeature:.25,storagePerVersion:.1},
 unmetPerformance:.75,
 featureDemand:.04,
 attack:{monthlyChance:.2,deadlineDays:7,targets:12,reputationLoss:6,fanLoss:.08,demandPenalty:.3,penaltyDays:30,securityReduction:.5,supportReduction:.3},
} as const;
