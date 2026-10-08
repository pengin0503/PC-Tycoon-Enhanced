export const aiGPUs=[{id:'v-ai-small',label:'Vector 16',vramBytes:16e9,peakFlops:1e14,powerWatts:250,cost:8000},{id:'v-ai-workstation',label:'Vector 48',vramBytes:48e9,peakFlops:2e14,powerWatts:350,cost:18000}];
export const aiBalance={serverCost:2000,trainCoefficient:6,efficiency:.4,routingOverhead:1.15,attentionOverhead:.1,
 trainingBytesPerParameter:16,reserveFactor:.1,kvBytesPerElement:2,shapeLower:2,shapeUpper:32,vocabulary:100000,
 electricityPerKwh:20,operationsPerGpuHour:35,lifetimeSeconds:3*365*86400,dataCostPerBillion:4000,
 inferenceUtilization:.01,quantSpeed:{4:1.5,8:1.2,16:1},quantPenalty:{4:.08,8:.01,16:0},
 benchmarkCeiling:99,preparationDays:7,failureThreshold:.3,failureCoefficient:.6,
 apiWeeklyDemand:100e6,subscriptionDemand:10000,tokensPerSubscriberMonth:3e6,fee:.03,refund:.02,serviceCapacityUtilization:.6,
 publicAwarenessDaily:.1,publicReputationDaily:.02,aiHardwareBoost:.5,marketBasePrice:1000,
} as const;
