// Product reception: reviews, fans, launch presentations and fictional benchmark games. All values are gameplay coefficients.
export const reviewAxes=['performance','value','quality','design','innovation'] as const;
export type ReviewAxis=typeof reviewAxes[number];
export const reviewAxisLabels:Record<ReviewAxis,string>={performance:'性能',value:'価格対性能',quality:'品質',design:'デザイン',innovation:'革新性'};
export const reviewBalance={
 weights:{performance:.35,value:.25,quality:.15,design:.1,innovation:.15} as Record<ReviewAxis,number>,
 performanceFloor:20,performanceScale:60,performanceExponent:.8,
 valueScale:70,valueExponent:.7,valuePerformanceCap:2,
 qualityBase:50,qualityScale:500,
 designBase:50,designPerTier:10,osSupportDesign:50,
 innovationFirst:70,innovationBase:50,innovationScale:200,innovationMin:10,
 outletNoise:12,
 demandFloor:.7,demandRange:.65,demandExponent:1.5,
} as const;
export const reviewOutlets=[
 {name:'TechPulse',focus:'performance'},{name:'ギガレビュー',focus:'value'},
 {name:'Circuit Weekly',focus:'quality'},{name:'ByteBench',focus:'innovation'},
] as const satisfies readonly {name:string,focus:ReviewAxis}[];
export const reviewComments:Record<ReviewAxis,{good:string,bad:string}>={
 performance:{good:'競合を突き放す処理性能。',bad:'性能面では競合に見劣りする。'},
 value:{good:'この価格でこの性能は買い。',bad:'価格に見合う性能とは言いがたい。'},
 quality:{good:'作りが堅牢で安心して使える。',bad:'品質面の不安が残る。'},
 design:{good:'外観の仕上げが目を引く。',bad:'デザインは平凡。'},
 innovation:{good:'前世代から大きく進化した。',bad:'前モデルからの進歩が乏しい。'},
};

export const presentations={
 none:{label:'なし',cost:0,hype:0,fans:1,awareness:0},
 online:{label:'オンライン配信',cost:200000,hype:10,fans:1.3,awareness:1},
 event:{label:'発表イベント',cost:1500000,hype:25,fans:1.8,awareness:3},
 keynote:{label:'大型基調講演',cost:6000000,hype:45,fans:2.5,awareness:6},
} as const;
export type PresentationKind=keyof typeof presentations;
export const presentationKinds=Object.keys(presentations) as PresentationKind[];

export const fanBalance={launchBase:200,awarenessScale:50,perUnit:.05,advertisingRoot:.05,weeklyDecay:.995,demandLog:20,demandCap:1.4,hypeWeeklyDecay:.85,hypeFloor:.5} as const;

/** Fictional titles used for FPS tests; loads are game units, not real-world requirements. */
export const benchmarkGames=[
 {id:'skyforge',name:'Skyforge Odyssey',genre:'オープンワールド',baseFps:60,cpuWeight:.35,gpuWeight:.65,minScore:600},
 {id:'neon-drift',name:'Neon Drift 2',genre:'レース',baseFps:90,cpuWeight:.3,gpuWeight:.7,minScore:450},
 {id:'citadel',name:'Citadel Tactics',genre:'ストラテジー',baseFps:75,cpuWeight:.7,gpuWeight:.3,minScore:400},
 {id:'arc-strike',name:'Arc Strike',genre:'FPS',baseFps:140,cpuWeight:.45,gpuWeight:.55,minScore:350},
 {id:'pixel-garden',name:'Pixel Garden',genre:'カジュアル',baseFps:120,cpuWeight:.5,gpuWeight:.5,minScore:100},
] as const;
export const benchmarkPresets={low:{label:'低',load:.55},high:{label:'高',load:1},ultra:{label:'最高',load:1.6}} as const;
export type BenchmarkPreset=keyof typeof benchmarkPresets;
export const benchmarkBalance={cpuReference:1200,gpuReference:1600,storageReference:150,ramReference:320,scoreScale:1000,laptopFactor:.8,fpsCap:480} as const;
