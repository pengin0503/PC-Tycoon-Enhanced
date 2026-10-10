import type {HardwareKind} from './research';
import {unlockedRange,unlockProgress,frontierGrowth,type Unlock,type OptionUnlock} from './unlocks';
import {unlockedOptions,techYear} from './era';
import {industrySockets} from './sockets';
export type Spec=Record<string,number|string>;
/**
 * `legacyDefault`: value assumed for products saved before the field existed (`legacyFrom`: copy another field instead).
 * `legacy`: a field only products from older saves carry; new designs neither show nor research it.
 * `unit`: display unit of the game value. `unlock`: the field's own research branch (`unlock.axes`, the field key) widens
 * the slider from `unlock.from` towards `max` (or towards `min` when `lowerIsBetter`). `values`: selectable steps of a
 * slider whose range spans several orders of magnitude. `optionUnlock`: technology years at which option choices
 * become available (one research stage = two years). `optionLabels`: Japanese names of option values.
 * Starting limits (`unlock.from`) and defaults are year-2000 technology; `unlock.base` is year-2100 technology and the
 * absolute bounds (`max`, or `min` when lower is better) are year-2200 technology, reached by the advanced research tier.
 */
export type Field={label:string,min?:number,max?:number,step?:number,values?:readonly number[],default:number|string,options?:string[],optionUnlock?:OptionUnlock,optionLabels?:Readonly<Record<string,string>>,legacyDefault?:number|string,legacyFrom?:string,legacy?:boolean,unit?:string,unlock?:Unlock,lowerIsBetter?:boolean};
export type HardwareDefinition={label:string,fields:Record<string,Field>,designCost:number,work:number,demand:number,reference:number};
/**
 * Unlock of a slider; its research branch is the field itself (filled in by `ownBranches`). `base` is the year-2100
 * bound; research stages 51–100 continue from it to the field's absolute bound.
 */
const u=(from:number,log:boolean,base:number):Unlock=>({axes:[],from,log,base});
const years=(years:Record<string,number>):OptionUnlock=>({axes:[],years});
const counts=[1,2,3,4,6,8,12,16,24,32,48,64,96,128,192,256,384,512,768,1024,1536,2048,3072,4096,6144,8192,12288,16384,24576,32768,49152,65536,98304,131072,196608,262144];
const binary=(from:number,to:number)=>{const out:number[]=[];for(let v=from;v<=to*1.0001;v*=2)out.push(Number(v.toPrecision(6)));return out;};
/** Cooler capacities: 1-2-5 style steps up to the year-2100 bound, then even steps of `step` W. */
const coolers=(from:number,base:number,to:number,step:number)=>[...decades(from,base),...Array.from({length:Math.round((to-base)/step)},(_,i)=>base+step*(i+1))];
/** Binary steps up to `base`, then 1-1.5-2 steps (×1.5, ×4/3) to `to` so the advanced research tier opens gradually. */
const binaryThenHalf=(from:number,base:number,to:number)=>[...binary(from,base),...binary(base*2,to).flatMap(v=>[v*.75,v])];
/** Memory sizes in GB: binary steps below 1 GB, then 1-1.5-2 style steps as modules and boards actually ship. */
const memorySizes=(from:number,to:number)=>[.008,.016,.032,.064,.128,.256,.512,1,2,3,4,6,8,12,16,24,32,48,64,96,128,192,256,384,512,768,1024,1536,2048,3072,4096,6144,8192,12288,16384,24576,32768,49152,65536].filter(v=>v>=from&&v<=to);
/** 1-2-5 style steps for quantities that grow by orders of magnitude (GB, MB/s, GB/s, W). */
const decades=(from:number,to:number)=>{
 const out:number[]=[];
 for(let e=Math.floor(Math.log10(from))-1;e<=Math.ceil(Math.log10(to));e++)for(const m of [1,1.5,2,3,4,5,6,8]){const v=Number((m*10**e).toPrecision(6));if(v>=from*.9999&&v<=to*1.0001)out.push(v);}
 return out;
};
/** Marketing node names in nm, from 350 nm down to 0.1 nm (year 2100) and 0.025 nm (year 2200). */
export const processNodes=[350,250,180,150,130,110,90,65,45,32,28,22,20,16,14,12,10,7,6,5,4,3,2,1.6,1.4,1,.7,.5,.35,.25,.18,.13,.1,.07,.05,.035,.025];
const memoryGenerations=['SDR','DDR','DDR2','DDR3','DDR4','DDR5','DDR6','DDR7','DDR8','DDR9','DDR10','DDR11'];
/** First technology year of each memory generation (motherboards and RAM). */
const memoryYears:Record<string,number>={SDR:2000,DDR:2000,DDR2:2004,DDR3:2007,DDR4:2014,DDR5:2021,DDR6:2030,DDR7:2042,DDR8:2058,DDR9:2078,DDR10:2120,DDR11:2165};
const panelTypes=['TN','VA','IPS','OLED','MicroLED','Holographic'];
/** PSU efficiency in %: whole percents, then the advanced tier's fractions above 99%. */
const efficiencies=[...Array.from({length:40},(_,i)=>60+i),99.2,99.5,99.7,99.8,99.9];
/** Fills each unlock with its own research branch: the field key. */
function ownBranches(fields:Record<string,Field>):Record<string,Field>{
 return Object.fromEntries(Object.entries(fields).map(([key,f])=>[key,{...f,
  ...(f.unlock?{unlock:{...f.unlock,axes:[key]}}:{}),...(f.optionUnlock?{optionUnlock:{...f.optionUnlock,axes:[key]}}:{})}]));
}
const define=(d:HardwareDefinition):HardwareDefinition=>({...d,fields:ownBranches(d.fields)});
export const hardwareCatalog:Record<HardwareKind,HardwareDefinition>={
 cpu:define({label:'CPU',designCost:300000000,work:20,demand:1400,reference:1200,fields:{
  cores:{label:'コア数',unit:'コア',min:1,max:16384,values:counts.filter(v=>v<=16384),default:1,unlock:u(1,true,4096)},
  clock:{label:'クロック',unit:'GHz',min:.1,max:25,step:.1,default:.8,unlock:u(1,false,10)},
  ipc:{label:'IPC相当',unit:'倍',min:.5,max:25,step:.1,default:1,unlock:u(1,false,10)},
  process:{label:'製造プロセス',unit:'nm',min:.025,max:350,values:processNodes,default:180,lowerIsBetter:true,unlock:u(180,true,.1)},
  cache:{label:'キャッシュ容量（旧データ互換）',unit:'MB',min:.0625,max:262144,values:binaryThenHalf(.0625,65536,262144),default:.25,legacyDefault:8,legacy:true},
  l1Cache:{label:'L1キャッシュ',unit:'MB',min:.0625,max:4096,values:binaryThenHalf(.0625,1024,4096),default:.0625,legacyDefault:.0625,unlock:u(.0625,true,1024)},
  l2Cache:{label:'L2キャッシュ',unit:'MB',min:.0625,max:32768,values:binaryThenHalf(.0625,8192,32768),default:.125,legacyDefault:.125,unlock:u(.125,true,8192)},
  l3Cache:{label:'L3キャッシュ',unit:'MB',min:.0625,max:262144,values:binaryThenHalf(.0625,65536,262144),default:.0625,legacyDefault:.0625,unlock:u(.0625,true,65536)},
  smt:{label:'同時マルチスレッディング',options:['off','on'],optionLabels:{off:'なし',on:'あり'},default:'off',legacyDefault:'off',optionUnlock:years({off:2000,on:2002})},
  memoryChannels:{label:'メモリチャネル数',unit:'ch',min:1,max:64,values:counts.filter(v=>v<=64),default:1,legacyDefault:1,unlock:u(1,true,16)},
  cooling:{label:'冷却性能',unit:'W',min:5,max:2000,values:coolers(5,1000,2000,100),default:40,legacyDefault:0,unlock:u(60,false,1000)},
  socket:{label:'ソケット',options:industrySockets.map(x=>x.name),default:'Atlas'}}}),
 gpu:define({label:'GPU',designCost:300000000,work:20,demand:1000,reference:1600,fields:{
  units:{label:'演算ユニット',unit:'基',min:1,max:262144,values:counts,default:2,unlock:u(4,true,65536)},
  clock:{label:'クロック',unit:'GHz',min:.05,max:15,step:.05,default:.2,unlock:u(.25,false,6)},
  vram:{label:'VRAM容量',unit:'GB',min:.008,max:16384,values:memorySizes(.008,16384),default:.032,unlock:u(.064,true,4096)},
  bandwidth:{label:'メモリ帯域',unit:'GB/s',min:1,max:4000000,values:decades(1,4000000),default:3,unlock:u(5,true,1000000)},
  busWidth:{label:'VRAMバス幅',unit:'bit',min:32,max:16384,values:counts.filter(v=>v>=32&&v<=16384),default:64,legacyDefault:64,unlock:u(64,true,4096)},
  process:{label:'製造プロセス',unit:'nm',min:.025,max:350,values:processNodes,default:180,legacyDefault:5,lowerIsBetter:true,unlock:u(180,true,.1)},
  cooling:{label:'冷却性能',unit:'W',min:5,max:3000,values:coolers(5,1500,3000,150),default:20,legacyDefault:0,unlock:u(40,false,1500)}}}),
 motherboard:define({label:'マザーボード',designCost:30000000,work:20,demand:1100,reference:225,fields:{socket:{label:'ソケット',options:industrySockets.map(x=>x.name),default:'Atlas'},
  memoryGen:{label:'メモリ世代',options:memoryGenerations,optionUnlock:years(memoryYears),default:'SDR'},
  slots:{label:'拡張スロット',unit:'本',min:1,max:24,step:1,default:5,unlock:u(6,false,12)},
  features:{label:'機能数（旧データ互換）',unit:'個',min:1,max:16,step:1,default:2,legacy:true},
  usb:{label:'USBポート',unit:'個',min:0,max:128,step:1,default:2,legacyDefault:2,unlock:u(4,false,32)},
  storagePorts:{label:'ストレージ接続',unit:'台',min:1,max:96,step:1,default:4,legacyDefault:4,unlock:u(4,false,24)},
  lan:{label:'有線LAN',unit:'Mbps',min:10,max:4000000,values:[10,100,1000,2500,5000,10000,25000,40000,100000,200000,400000,1000000,1500000,2000000,3000000,4000000],default:100,legacyDefault:100,unlock:u(100,true,1000000)},
  bus:{label:'チップセット帯域',unit:'GB/s',min:.5,max:400000,values:decades(.5,400000),default:1,legacyDefault:64,unlock:u(1,true,100000)}}}),
 ram:define({label:'RAM',designCost:20000000,work:20,demand:1400,reference:320,fields:{memoryGen:{label:'メモリ世代',options:memoryGenerations,optionUnlock:years(memoryYears),default:'SDR'},
  capacity:{label:'容量',unit:'GB',min:.016,max:65536,values:memorySizes(.016,65536),default:.128,unlock:u(.256,true,16384)},
  latency:{label:'CAS相当遅延',unit:'ns',min:.25,max:40,step:.25,default:7,legacyDefault:7,lowerIsBetter:true,unlock:u(7,true,1)},
  speed:{label:'転送レート',unit:'MT/s',min:66,max:800000,values:[66,100,133,200,266,333,400,533,667,800,1066,1333,1600,1866,2133,2400,2666,3200,3600,4000,4800,5600,6400,7200,8000,8800,10000,12800,16000,20000,25600,32000,40000,51200,64000,80000,100000,128000,160000,200000,256000,320000,400000,512000,640000,800000],default:133,unlock:u(266,true,200000)}}}),
 storage:define({label:'ストレージ',designCost:100000000,work:20,demand:1400,reference:150,fields:{
  capacity:{label:'容量',unit:'GB',min:1,max:20000000,values:decades(1,20000000),default:20,unlock:u(80,true,4000000)},
  speed:{label:'読み込み速度',unit:'MB/s',min:5,max:8000000,values:decades(5,8000000),default:30,unlock:u(40,true,2000000)},
  writeSpeed:{label:'書き込み速度',unit:'MB/s',min:5,max:8000000,values:decades(5,8000000),default:20,legacyFrom:'speed',unlock:u(30,true,2000000)},
  iops:{label:'ランダムI/O性能',unit:'IOPS',min:100,max:400000000,values:decades(100,400000000),default:100,legacyDefault:100,unlock:u(100,true,100000000)}}}),
 psu:define({label:'電源ユニット',designCost:15000000,work:20,demand:1200,reference:175,fields:{
  wattage:{label:'定格出力',unit:'W',min:150,max:12000,step:50,default:250,unlock:u(400,false,3000)},
  efficiency:{label:'変換効率',unit:'%',min:60,max:99.9,values:efficiencies,default:70,unlock:u(75,false,99)},
  modular:{label:'ケーブル方式',options:['none','semi','full'],optionLabels:{none:'直付け',semi:'セミモジュラー',full:'フルモジュラー'},optionUnlock:years({semi:2004,full:2008}),default:'none'}}}),
 monitor:define({label:'モニター',designCost:50000000,work:20,demand:900,reference:600,fields:{
  size:{label:'画面サイズ',unit:'インチ',min:12,max:150,values:[12,14,15,17,19,20,21,22,24,27,32,34,38,42,49,55,65,77,85,100,110,120,135,150],default:15,legacyDefault:15,unlock:u(21,false,100)},
  resolution:{label:'解像度（縦）',unit:'p',min:480,max:69120,values:[480,600,768,900,1024,1080,1200,1440,1600,2160,2880,4320,8640,17280,25920,34560,51840,69120],default:768,unlock:u(1200,true,17280)},
  refresh:{label:'リフレッシュレート',unit:'Hz',min:50,max:8000,values:[50,60,70,75,85,100,120,144,165,180,240,280,360,480,540,750,1000,1500,2000,3000,4000,6000,8000],default:75,unlock:u(85,true,2000)},
  panel:{label:'パネル方式',options:panelTypes,optionUnlock:years({TN:2000,VA:2000,IPS:2004,OLED:2018,MicroLED:2032,Holographic:2150}),optionLabels:{Holographic:'ホログラフィック'},default:'TN',legacyDefault:'TN'},
  response:{label:'応答速度',unit:'ms',min:.002,max:50,values:[50,40,30,25,16,12,8,5,4,2,1,.5,.2,.1,.03,.01,.007,.005,.003,.002],default:25,legacyDefault:25,lowerIsBetter:true,unlock:u(16,true,.01)},
  brightness:{label:'輝度',unit:'cd/m²',min:150,max:40000,values:[150,200,250,300,350,400,500,600,800,1000,1400,2000,3000,4000,6000,10000,15000,20000,30000,40000],default:250,legacyDefault:250,unlock:u(300,true,10000)},
  gamut:{label:'色域',unit:'%',min:40,max:150,step:1,default:70,unlock:u(75,false,100)},
  appearance:{label:'外観',options:['graphite','silver','teal'],optionLabels:{graphite:'グラファイト',silver:'シルバー',teal:'ティール'},default:'silver'}}}),
};
/** Fields a new design sets (legacy compatibility fields excluded). */
export const designFields=(kind:HardwareKind)=>Object.entries(hardwareCatalog[kind].fields).filter(([,f])=>!f.legacy);
/**
 * Money is in yen at roughly real-world year-2000 Japanese retail scale.
 * Costs: a value enters the cost as `value / growth^(1 - frontierCost)` (`growth`: how far research has moved the
 * field's frontier, see `frontierGrowth`), so the same specification gets cheaper as research advances while a frontier
 * design costs `growth^frontierCost` times a year-2000 frontier design. CPU and GPU logic is priced per process node:
 * cost per unit of logic falls with smaller nodes (`nodeCostExponent`), and a node is dearer while it is the newest one
 * the company has researched (`freshNodePremium`) and cheaper once research has moved several nodes past it.
 * Power uses the designed values; the energy per operation falls with the node (`processExponent`, steeper below
 * `deepProcess` so that year-2100 frontier designs stay within the cooling research of their time).
 */
export const hardwareBalance={baseFactoryCapacity:200,developmentPerWeek:10,researchPerWeek:10,maxInventory:1000000,maxPrice:100000000,
 reliabilityBase:.9,valueCeiling:2,
 /** Share of the selling price at which discontinued stock is cleared. */
 clearanceShare:.5,priceCostMultiple:2,priceElasticity:1.5,osReferencePrice:10000,osWeeklyLimit:5000,hardDemand:.8,tycoonDemand:1.2,
 /** Cooler cost per W of capacity; headroom above power draw adds reliability up to `reliabilityBonus` at `fullHeadroom`. */
 cooling:{cost:{cpu:50,gpu:40} as Record<string,number>,reliabilityBonus:.02,fullHeadroom:.5,frontierCost:.15},
 referenceProcess:180,processExponent:1,deepProcess:4,deepProcessExponent:1.2,
 node:{costExponent:1.2,freshPremium:.5,matureFloor:.5,maturitySteps:1,deepProcess:.1,deepCostExponent:.8},
 psu:{wattageCost:12,efficiencyCost:300,efficiencyBase:70,modularCost:{none:0,semi:1500,full:3000},modularScore:{none:1,semi:1.05,full:1.1},lossCoefficient:.2,headroom:1.2,reliabilityPerEfficiency:.002,baseCost:1000,frontierCost:.15},
 cpu:{cacheReference:.25,cacheExponent:.15,baseCost:4000,coreCost:5500,cacheCost:8000,clockArea:.25,ipcCostExponent:1.2,smtArea:1.06,channelCost:1200,powerCoefficient:39,scoreCoefficient:1500,frontierCost:.15},
 gpu:{baseCost:2000,unitCost:1333,clockArea:1,busCost:800,vramCost:93750,bandwidthCost:300,powerCoefficient:29,unitsPowerExponent:.88,scoreCoefficient:4000,bandwidthPerOp:6.6,frontierCost:.15},
 motherboard:{baseCost:3000,slotCost:800,usbCost:300,portCost:250,lanCost:6,busCost:1500,slotScore:25,usbScore:15,portScore:10,lanScore:30,featureScore:50,busReference:1,busExponent:.5,basePower:10,usbPower:.25,portPower:.1,lanPower:.004,featurePower:1,featureCost:600,frontierCost:.1},
 ram:{baseCost:500,capacityCost:40000,speedCost:10,latencyCost:800,scoreDivisor:.0532,powerCoefficient:.2,basePower:2,frontierCost:.1},
 storage:{baseCost:3000,capacityCost:150,speedCost:60,writeCost:40,iopsCost:.05,scoreCoefficient:6.12,basePower:4,speedPower:.05,readWeight:.6,frontierCost:.1},
 weeklyVariance:.2,awarenessFloor:.7,qualityFloor:.5,ageDecay:360,minimumAgeFactor:.25,
 monitor:{baseCost:6000,sizeCost:8,resolutionCost:10,refreshCost:100,gamutCost:100,responseCost:300,brightnessCost:6,scoreCoefficient:1.49e-4,powerCoefficient:.04,referenceRefresh:75,referenceSize:15,referenceResponse:25,referenceBrightness:250,
  panelScore:{TN:1,VA:1.05,IPS:1.12,OLED:1.3,MicroLED:1.4,Holographic:1.6} as Record<string,number>,panelPower:{TN:1,VA:1,IPS:1.1,OLED:.8,MicroLED:.6,Holographic:.5} as Record<string,number>,
  panelCost:{TN:0,VA:1500,IPS:5000,OLED:40000,MicroLED:80000,Holographic:160000} as Record<string,number>,panelMaturityYears:25,panelMatureShare:.1,frontierCost:.2},
} as const;
export function defaultSpec(kind:HardwareKind):Spec{return Object.fromEntries(designFields(kind).map(([k,v])=>[k,v.default]));}
/** Fills fields added after a product was saved; keeps legacy fields only when present; rejects unknown fields. */
export function normalizeSpec(kind:HardwareKind,spec:Spec):Spec{
 const fields=hardwareCatalog[kind].fields;
 if(Object.keys(spec).some(k=>!(k in fields)))throw new Error('仕様の項目が不正です');
 const out:Spec={};
 for(const [key,field] of Object.entries(fields)){
  if(field.legacy&&spec[key]===undefined)continue;
  const v=spec[key]??(field.legacyFrom!==undefined?spec[field.legacyFrom]:field.legacyDefault);
  if(v===undefined)throw new Error('仕様の項目が不正です');
  out[key]=v;
 }
 return out;
}
/** Selectable range of a numeric field with the given completed research. */
export function fieldRange(kind:HardwareKind,key:string,completed:readonly string[]){return unlockedRange(hardwareCatalog[kind].fields[key],kind,completed);}
/** Option choices of a field available with the given completed research. */
export function fieldOptions(kind:HardwareKind,key:string,completed:readonly string[]){const f=hardwareCatalog[kind].fields[key];return unlockedOptions(f.options??[],f.optionUnlock,kind,completed);}
/** Frontier growth of a field with the given research (1 for fields research does not widen). */
export function fieldGrowth(kind:HardwareKind,key:string,completed:readonly string[]){
 const f=hardwareCatalog[kind].fields[key];return f.unlock?frontierGrowth(f,unlockProgress(completed,kind,f.unlock.axes)):1;
}
/** Research branches of the sliders of a component (the field keys whose ranges research widens). */
export function sliderBranches(kind:HardwareKind){return designFields(kind).filter(([,f])=>f.unlock).map(([k])=>k);}
/** Technology year a component's research has reached: the mean progress of its slider branches. */
export function hardwareTechYear(kind:HardwareKind,completed:readonly string[]){
 return techYear(completed,kind,sliderBranches(kind));
}
/** Technology year of one option branch (e.g. memory generations, panel types). */
export function optionTechYear(kind:HardwareKind,key:string,completed:readonly string[]){return techYear(completed,kind,[key]);}
/** Reliability gained from cooling capacity above the power draw (0 when the cooler only just suffices). */
export function coolingReliability(power:number,cooling:number){
 const c=hardwareBalance.cooling;const headroom=Math.max(0,cooling-power)/Math.max(1,power);
 return c.reliabilityBonus*Math.min(1,headroom/c.fullHeadroom);
}
/** Energy per operation of a process node relative to 180 nm. */
export function processPowerFactor(nm:number){
 const b=hardwareBalance;const at=(n:number)=>(n/b.referenceProcess)**b.processExponent;
 return nm>=b.deepProcess?at(nm):at(b.deepProcess)*(nm/b.deepProcess)**b.deepProcessExponent;
}
/**
 * Cost of one unit of logic on a process node relative to a fresh 180 nm node. `frontier` is the smallest node the
 * company's research allows: that node carries the new-node premium, which fades as research moves past it. Nodes of
 * the advanced tier (below `node.deepProcess`) get cheaper per unit of logic faster (`deepCostExponent`), so a year-2200
 * frontier CPU costs about ¥420k, close to a year-2100 one (¥370k), instead of the ¥1.3M plain node scaling would give.
 */
export function processCostFactor(nm:number,frontier:number){
 const n=hardwareBalance.node;
 const index=(v:number)=>{let best=0;for(let i=1;i<processNodes.length;i++)if(Math.abs(Math.log(processNodes[i]/v))<Math.abs(Math.log(processNodes[best]/v)))best=i;return best;};
 const behind=Math.max(0,index(frontier)-index(nm));
 const fresh=.5**(behind/n.maturitySteps);
 const deep=nm<n.deepProcess?(nm/n.deepProcess)**n.deepCostExponent:1;
 return (nm/hardwareBalance.referenceProcess)**n.costExponent*deep*(n.matureFloor+(1+n.freshPremium-n.matureFloor)*fresh);
}
