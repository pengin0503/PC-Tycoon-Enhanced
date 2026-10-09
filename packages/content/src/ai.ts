export const aiGPUs=[{id:'v-ai-small',label:'Vector 16',vramBytes:16e9,peakFlops:1e14,powerWatts:250,cost:800000},{id:'v-ai-workstation',label:'Vector 48',vramBytes:48e9,peakFlops:2e14,powerWatts:350,cost:1800000}];
/**
 * Selectable model-design values. Research widens the upper bound from `unlock.from` (AI branch levels);
 * list-valued sliders snap to the listed sizes. Scales: parameters/tokens in units of 1e9.
 */
export const aiDesignSliders={
 total:{label:'総パラメータ',unit:'B',scale:1e9,values:[.1,.25,.5,1,2,3,4,7,8,13,20,30,34,50,70,100,175,200,400,700,1000],min:.1,max:1000,unlock:{axes:['compute'],from:4}},
 active:{label:'稼働パラメータ',unit:'B',scale:1e9,values:[.1,.25,.5,1,2,3,4,7,8,13,20,30,34,50,70,100,175,200,400,700,1000],min:.1,max:1000,unlock:{axes:['compute'],from:4}},
 layers:{label:'層数',unit:'層',scale:1,min:1,max:256,step:1,unlock:{axes:['architecture'],from:32}},
 hidden:{label:'Hidden size',unit:'',scale:1,min:128,max:32768,step:128,unlock:{axes:['architecture'],from:4096}},
 context:{label:'学習コンテキスト長',unit:'トークン',scale:1,values:[512,1024,2048,4096,8192,16384,32768,65536,131072,262144,524288,1048576],min:512,max:1048576,unlock:{axes:['context'],from:8192}},
 tokens:{label:'学習トークン数',unit:'B',scale:1e9,values:[1,2,5,10,20,50,100,200,500,1000,2000,5000,10000],min:1,max:10000,unlock:{axes:['data'],from:50}},
 quality:{label:'データ品質',unit:'',scale:1,min:.1,max:1,step:.1,percent:true},
 diversity:{label:'データ多様性',unit:'',scale:1,min:.1,max:1,step:.1,percent:true},
} as const;
export type AISlider=keyof typeof aiDesignSliders;
/**
 * Money in yen. Service prices (API per million tokens, monthly plans) and electricity are real-world scale; demand was
 * raised with the ×100 economy so AI services stay comparable to the hardware business. GPU compute follows the GPU's
 * performance score: `gpuFlopsAtReference` FLOPS at the year-2000 reference score, growing with its square.
 */
export const aiBalance={serverCost:200000,trainCoefficient:6,efficiency:.4,routingOverhead:1.15,attentionOverhead:.1,
 trainingBytesPerParameter:16,reserveFactor:.1,kvBytesPerElement:2,shapeLower:2,shapeUpper:32,vocabulary:100000,
 electricityPerKwh:20,operationsPerGpuHour:35,lifetimeSeconds:3*365*86400,dataCostPerBillion:400000,
 inferenceUtilization:.01,quantSpeed:{4:1.5,8:1.2,16:1},quantPenalty:{4:.08,8:.01,16:0},
 benchmarkCeiling:99,preparationDays:7,failureThreshold:.3,failureCoefficient:.6,
 apiWeeklyDemand:10e9,subscriptionDemand:33000,tokensPerSubscriberMonth:3e6,fee:.03,refund:.02,serviceCapacityUtilization:.6,
 publicAwarenessDaily:.1,publicReputationDaily:.02,aiHardwareBoost:.5,marketBasePrice:1000,contextReference:8192,architectureEfficiency:.2,computeEfficiency:.1,dataBase:.2,dataQuality:.5,dataDiversity:.3,groupedKvFactor:.25,maxBatchSpeed:2,quantResearchSpeed:.1,
 benchmarkDepthCeiling:1.2,benchmarkReferenceLayers:25,parameterExponent:.25,tokenExponent:.25,diversityFloor:.5,techBonusCeiling:.5,groupedScore:.99,breadthCeiling:1.12,breadthBonus:.03,mathScore:.95,codingFloor:.7,codingQuality:.3,moeReasoning:.94,
 gpuFlopsAtReference:1e9,gpuReferenceScore:1600,gpuFlopsExponent:2,serverPerformanceReference:1000,trainingStaffTimeScale:100,preparationStaffScale:10,architectureScore:.1,marketPriceFloor:200,competitorPriceDecay:.02,priceUndercut:.98,marketQualityCeiling:85,marketQualityBase:25,marketQualityPerTech:3,brandAwarenessFloor:.4,brandReputationFloor:.5,competition:.2,priceElasticity:.8,demandFloor:.9,demandVariance:.2,subscriptionReferencePrice:3000,
} as const;
