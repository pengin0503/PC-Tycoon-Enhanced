import {useState,type ReactNode} from 'react';
import {estimateLLM,estimateInference,benchmarks,clusterCost,type LLMDesign} from '../../../packages/sim/src/ai-math';
import {aiMarketQuote,aiEffects,aiDesignRange,clusterBusy} from '../../../packages/sim/src/ai';
import {designSchema} from '../../../packages/sim/src/ai-schema';
import {researchPointCost} from '../../../packages/sim/src/business';
import {aiDesignSliders,aiBalance,type AISlider} from '../../../packages/content/src/ai';
import {techEffect} from '../../../packages/content/src/research';
import type {GameState,GameCommand} from '../../../packages/sim/src/index';
import {PanelPages} from './PanelPages';
import {ProductIllustration} from './ProductIllustration';
import {RangeField,formatValue} from './RangeField';
import {ActionBar,lockFor} from './DevelopScreen';
import {describeWithResearch} from './research-hints';
import {Meter,Empty,Chip} from './ui';
import {yen} from './i18n';

type Send=(c:GameCommand)=>boolean;
type View={kind:'home'}|{kind:'cluster'}|{kind:'model'}|{kind:'deploy',id:string};
type Model=GameState['models'][number];
const scoreLabels:Record<keyof Model['scores'],string>={math:'数学',coding:'コード',knowledge:'知識',reasoning:'推論',multilingual:'多言語'};
const percent=(n:number)=>`${Math.round(n*100)}%`;
const gb=(bytes:number)=>`${(bytes/1e9).toLocaleString('ja-JP',{maximumFractionDigits:1})}GB`;
/** Context lengths are powers of two: 8,192 → "8Kトークン", 1,048,576 → "1Mトークン" (keeps the slider endpoints on one line). */
const tokenLength=(n:number)=>n>=1048576&&n%1048576===0?`${formatValue(n/1048576,'M')}トークン`:n>=1024&&n%1024===0?`${formatValue(n/1024,'K')}トークン`:`${formatValue(n)}トークン`;
const statusLabel=(m:Model)=>m.status==='ready'?'評価完了':m.status==='failed'?'学習失敗':'学習中';
const initial:LLMDesign={architecture:'dense',total:1e9,active:1e9,layers:24,hidden:2048,attention:'standard',context:4096,tokens:1e9,quality:.8,diversity:.8};

/** AI Lab: the same flow as product development — a home of categories, then a designer workbench per thing built. */
export function AIPanel({state,send}:{state:GameState,send:Send}){
 const [view,setView]=useState<View>({kind:'home'});
 const home=()=>setView({kind:'home'});
 const back=<button className="back-button" onClick={home}>← AI Lab</button>;
 if(view.kind==='cluster')return <ClusterDesigner state={state} send={send} back={back} done={home}/>;
 if(view.kind==='model')return <ModelDesigner state={state} send={send} back={back} done={home}/>;
 if(view.kind==='deploy'){const m=state.models.find(m=>m.id===view.id);if(m)return <DeployDesigner key={m.id} state={state} model={m} send={send} back={back} done={home}/>;}
 return <AIHome state={state} send={send} open={setView}/>;
}

function AIHome({state,send,open}:{state:GameState,send:Send,open:(v:View)=>void}){
 const ready=state.research.completed.includes('ai-compute-1');const unlockCost=researchPointCost(state,'ai-compute-1');
 return <section className="screen develop-home ai-home"><header className="screen-title"><h2>AI Lab</h2><p>すべての評価は架空のゲームスコアです。自社GPUでクラスタを組み、モデルを設計・学習してサービスとして提供します。</p></header>
  <PanelPages labels={['開発','モデル','クラスタ']}>
   <div className="category-grid">
    <article className={`category-tile ${ready?'':'locked'}`}><div className="tile-art"><ProductIllustration kind="ai-cluster" tier={0} color="graphite"/></div><h3>計算クラスタ</h3>
     {ready?<><small>{state.clusters.length?`${state.clusters.length}基 稼働`:'未構築'}</small><button className="primary" aria-label="クラスタを構築" onClick={()=>open({kind:'cluster'})}>構築する</button></>
      :<><small>🔒 研究が必要</small><button aria-label="AI Labを解放" disabled={state.company.researchPoints<unlockCost} onClick={()=>send({type:'research',id:'ai-compute-1'})}>解放 {unlockCost.toLocaleString('ja-JP')} RP</button></>}</article>
    <article className={`category-tile ${ready&&state.clusters.length?'':'locked'}`}><div className="tile-art"><ProductIllustration kind="ai-model" tier={0} color="silver"/></div><h3>AIモデル</h3>
     <small>{!ready?'🔒 研究が必要':state.clusters.length?`${state.models.length}モデル`:'クラスタが必要です'}</small>
     <button className="primary" aria-label="AIモデルを設計" disabled={!ready||!state.clusters.length} onClick={()=>open({kind:'model'})}>設計する</button></article>
   </div>
   <div>{state.models.length?<div className="grid-list ai-roster">{state.models.map(m=><ModelCard key={m.id} model={m} send={send} configure={()=>open({kind:'deploy',id:m.id})}/>)}</div>:<Empty>まだモデルがありません。「開発」からAIモデルを設計しましょう。</Empty>}</div>
   <div>{state.clusters.length?<div className="grid-list ai-roster">{state.clusters.map(c=>{const user=state.models.find(m=>m.status==='training'&&m.clusterId===c.id)??state.models.find(m=>m.service?.enabled&&m.service.mode!=='open'&&m.service.clusterId===c.id);
     return <article key={c.id} className="card"><h3>{c.id} · GPU {c.gpus}枚</h3><dl><dt>VRAM合計</dt><dd>{gb(c.vramBytes)}</dd><dt>演算性能</dt><dd>{(c.peakFlops/1e15).toLocaleString('ja-JP',{maximumFractionDigits:2})} PFLOPS</dd><dt>消費電力</dt><dd>{(c.powerWatts/1000).toLocaleString('ja-JP',{maximumFractionDigits:1})}kW</dd><dt>設備投資</dt><dd>{yen(c.purchaseCost)}</dd><dt>使用状況</dt><dd>{user?`${user.name}（${user.status==='training'?'学習':'推論'}）`:'空き'}</dd></dl></article>;})}</div>
    :<Empty>クラスタがありません。「開発」から構築しましょう。</Empty>}</div>
  </PanelPages></section>;
}

function ModelCard({model:m,send,configure}:{model:Model,send:Send,configure:()=>void}){
 return <article className="card"><h3>{m.name}</h3><span className="pill" data-testid={`model-status-${m.id}`}>{statusLabel(m)}</span>
  <p>学習費 {yen(m.trainingCost)} · {m.design.architecture.toUpperCase()} · {formatValue(m.design.total/1e9,'B')}</p>
  {m.status==='training'&&<progress max={1} value={1-Math.max(m.remainingSeconds/m.initialSeconds,m.preparationRemaining/aiBalance.preparationDays)}/>}
  {m.status==='ready'&&<dl>{(Object.keys(scoreLabels) as (keyof Model['scores'])[]).map(k=><div key={k}><dt>{scoreLabels[k]}</dt><dd>{m.scores[k]}</dd></div>)}</dl>}
  {m.service&&<><p>利用トークン {m.service.tokens.toLocaleString('ja-JP')} / 契約 {m.service.users.toLocaleString('ja-JP')}</p><p>サービス売上 <b data-testid={`ai-revenue-${m.id}`}>{yen(m.service.revenue)}</b> / 運用費 {yen(m.service.cost)}</p><p>学習費を含む利益 {yen(m.service.revenue-m.service.cost-m.trainingCost)}</p></>}
  <div className="button-row">{m.status==='ready'&&<button className="primary" onClick={configure}>{m.service?.enabled?'サービスを変更':'サービスを設定'}</button>}
   {m.service?.enabled&&<button onClick={()=>send({type:'retireModel',id:m.id})}>サービスを停止</button>}</div></article>;
}

function Stage({eyebrow,kind,title,children}:{eyebrow:string,kind:string,title:string,children:ReactNode}){
 return <section className="card product-stage"><p className="eyebrow">{eyebrow}</p><ProductIllustration kind={kind} tier={0} color="graphite"/><h2>{title}</h2>{children}</section>;
}

function ClusterDesigner({state,send,back,done}:{state:GameState,send:Send,back:ReactNode,done:()=>void}){
 const ownedGPUs=state.products.filter(p=>p.kind==='gpu'&&p.launched&&p.remaining===0&&p.line&&p.target>0);
 const servers=state.products.filter(p=>p.kind==='pc'&&p.spec.purpose==='server'&&p.launched);
 const [gpuId,setGPU]=useState(ownedGPUs[0]?.id??'');const own=ownedGPUs.find(p=>p.id===gpuId)??ownedGPUs[0];
 const [serverId,setServer]=useState('vendor');const server=servers.find(p=>p.id===serverId);
 const maxGPUs=Math.max(1,Math.min(256,own?.inventory??1));
 const [gpuChoice,setGPUs]=useState(1);const gpus=Math.min(gpuChoice,maxGPUs);
 const [network,setNetwork]=useState(.8);const [cooling,setCooling]=useState(.9);
 const cost=server?0:aiBalance.serverCost;
 const effectiveNetwork=network*Math.min(1,server?server.performance/aiBalance.serverPerformanceReference:1);
 const problem=!state.research.completed.includes('ai-compute-1')?'AI基盤研究が必要です'
  :!own?'製造中の自社GPUがありません。GPUを開発・発売し、生産ラインを稼働してください。'
  :own.inventory<gpus?`自社GPU在庫が不足しています（在庫 ${own.inventory}枚）`
  :serverId!=='vendor'&&(!server||server.inventory<1)?'自社サーバーの在庫が必要です':'';
 const submit=()=>{if(own&&send({type:'buyCluster',gpuId:own.id,serverId,gpus,network,cooling}))done();};
 return <section className="screen designer">
  <div className="workbench">
   <Stage eyebrow="CLUSTER BUILDER / AI LAB" kind="ai-cluster" title={`クラスタ c-${state.clusters.length+1}`}>
    {own?<div className="preview-metrics"><span>GPU<strong>{gpus}枚</strong></span><span>VRAM合計<strong>{formatValue(Number(own.spec.vram)*gpus,'GB')}</strong></span>
     <span>演算性能<strong>{(own.performance*aiBalance.ownGpuFlopsPerScore*gpus/1e15).toLocaleString('ja-JP',{maximumFractionDigits:2})} PFLOPS</strong></span>
     <span>消費電力<strong>{((own.power*gpus+(server?.power??0))/1000).toLocaleString('ja-JP',{maximumFractionDigits:2})}kW</strong></span>
     <span>学習効率<strong>{percent(aiBalance.efficiency*effectiveNetwork*cooling)}</strong></span></div>:null}
    {problem?<p role="alert" className="warning">{problem}</p>:<p className="hint">GPUは在庫から移され、クラスタの設備価値になります。クラスタは学習か有料サービスのどちらか一つに使えます。</p>}
   </Stage>
   <section className="card design-controls">
    <PanelPages labels={['構成','効率']}>
     <div><div className="form-grid"><label>自社GPU（生産中）<select value={own?.id??''} onChange={e=>setGPU(e.target.value)}>{!own&&<option value="">製造中の自社GPUなし</option>}{ownedGPUs.map(p=><option key={p.id} value={p.id}>{p.name} · 在庫 {p.inventory} · VRAM {p.spec.vram}GB</option>)}</select></label>
      <label>サーバー<select value={serverId} onChange={e=>setServer(e.target.value)}><option value="vendor">購入サーバー（{yen(aiBalance.serverCost)}）</option>{servers.map(p=><option key={p.id} value={p.id}>自社 {p.name} · 在庫 {p.inventory}</option>)}</select></label></div>
      <div className="range-grid"><RangeField label="GPU枚数" unit="枚" description="クラスタに載せる自社GPUの枚数。VRAMと演算性能が比例して増えます。上限は自社GPUの在庫数です。" min={1} max={maxGPUs} step={1} value={gpus} onChange={setGPUs}/></div></div>
     <div className="range-grid"><RangeField label="ネットワーク効率" format={percent} description="GPU間通信の効率。学習と推論の速度に掛かります。自社サーバーの性能が低いと実効値が下がります。" min={.1} max={1} step={.1} value={network} onChange={setNetwork}/>
      <RangeField label="冷却効率" format={percent} description="クラスタ設備の冷却効率。学習と推論の速度に掛かります。" min={.1} max={1} step={.1} value={cooling} onChange={setCooling}/></div>
    </PanelPages>
   </section>
  </div>
  <ActionBar back={back} costLabel="設備費" cost={cost} label="クラスタを購入" disabled={!!problem||state.company.cash<cost} onClick={submit}/>
 </section>;
}

const gatedKeys=['total','active','layers','hidden','context','tokens'] as const;
/** Picks layers/hidden so the active parameters fit the transformer shape rules within the unlocked ranges. */
function fitShape(active:number,layerMax:number,hiddenMax:number){
 let best:{layers:number,hidden:number,score:number}|null=null;
 for(let hidden=128;hidden<=hiddenMax;hidden+=128){
  const layers=Math.round(active/(12*hidden*hidden));if(layers<1||layers>layerMax)continue;
  const core=layers*hidden*hidden;if(active<core*aiBalance.shapeLower||active>core*aiBalance.shapeUpper+hidden*aiBalance.vocabulary)continue;
  const score=Math.abs(Math.log(hidden/layers/100));if(!best||score<best.score)best={layers,hidden,score};
 }
 return best;
}
function ModelDesigner({state,send,back,done}:{state:GameState,send:Send,back:ReactNode,done:()=>void}){
 const completed=state.research.completed;
 const range=(k:AISlider)=>aiDesignRange(k,completed);
 const free=state.clusters.find(c=>!clusterBusy(state,c.id));
 const [clusterId,setCluster]=useState(free?.id??state.clusters[0]?.id??'');
 const cluster=state.clusters.find(c=>c.id===clusterId);
 const [design,setDesign]=useState<LLMDesign>(initial);
 const [name,setName]=useState(`Polar ${state.models.length+1}`);
 const moeReady=completed.includes('ai-architecture-1');
 const set=(key:AISlider,display:number)=>{
  const value=Math.round(display*aiDesignSliders[key].scale*1e6)/1e6;
  const next={...design,[key]:value};
  if(key==='total'&&next.architecture==='dense')next.active=value;
  if(key==='total'&&next.active>value)next.active=value;
  if(key==='total'||key==='active'){const shape=fitShape(next.active,range('layers').max,range('hidden').max);if(shape){next.layers=shape.layers;next.hidden=shape.hidden;}}
  setDesign(next);
 };
 const architecture=(a:LLMDesign['architecture'])=>{
  if(a!=='dense'){setDesign({...design,architecture:a});return;}
  // Dense uses every parameter per token, so the shape must be refitted to the (larger) active count.
  const next={...design,architecture:a,active:design.total};const shape=fitShape(next.active,range('layers').max,range('hidden').max);
  setDesign(shape?{...next,layers:shape.layers,hidden:shape.hidden}:next);
 };
 const effects=aiEffects(state);
 const parsed=designSchema.safeParse(design);
 let train:ReturnType<typeof estimateLLM>|null=null;
 if(parsed.success&&cluster)train=estimateLLM(design,cluster,effects);
 const over=gatedKeys.filter(k=>design[k]/aiDesignSliders[k].scale>range(k).max+1e-9);
 const problem=!cluster?'クラスタがありません'
  :!parsed.success?parsed.error.issues[0]?.message??'設計を確認してください'
  :over.length?`${aiDesignSliders[over[0]].label}が研究の上限を超えています`
  :clusterBusy(state,cluster.id)?'このクラスタは使用中です。別のクラスタを選んでください。'
  :train&&train.trainingMemoryBytes>cluster.vramBytes?`学習VRAMが不足しています（必要 ${gb(train.trainingMemoryBytes)} / クラスタ ${gb(cluster.vramBytes)}）`:'';
 const forecast=parsed.success?benchmarks({...design,quality:design.quality+(1-design.quality)*(1-Math.exp(-techEffect(completed,'ai','data')))},techEffect(completed,'ai','compute')+techEffect(completed,'ai','architecture')*aiBalance.architectureScore):null;
 const cost=train?.cost??0;
 const submit=()=>{if(cluster&&send({type:'trainModel',name,design,clusterId:cluster.id,budget:Math.max(1,cost)}))done();};
 const slider=(key:AISlider,extra:Partial<Parameters<typeof RangeField>[0]>={})=>{const s=aiDesignSliders[key],r=range(key);
  return <RangeField key={key} label={s.label} unit={s.unit} format={'percent' in s?percent:key==='context'?tokenLength:undefined} min={r.min} max={r.max} step={'step' in s?s.step:1} values={'values' in s?s.values:undefined}
   value={design[key] as number/s.scale} onChange={v=>set(key,v)} description={describeWithResearch(aiHelp[key],'ai','unlock' in s?s.unlock.axes:undefined)} researchLimit={'unlock' in s?lockFor(s,r,'ai'):undefined} {...extra}/>;};
 return <section className="screen designer">
  <div className="workbench">
   <Stage eyebrow="MODEL STUDIO / AI LAB" kind="ai-model" title={name||'AIモデル'}>
    <div className="preview-metrics"><span>総パラメータ<strong>{formatValue(design.total/1e9,'B')}</strong></span>
     <span>学習期間<strong>{train?`${(train.seconds/86400).toLocaleString('ja-JP',{maximumFractionDigits:1})}日`:'-'}</strong></span>
     <span>学習VRAM<strong>{train?gb(train.trainingMemoryBytes):'-'}{cluster?` / ${gb(cluster.vramBytes)}`:''}</strong></span>
     <span>学習費<strong>{train?yen(train.cost):'-'}</strong></span></div>
    {problem?<p role="alert" className="warning">{problem}</p>:forecast&&<div className="forecast" aria-label="ベンチマーク予測"><div className="forecast-head"><span>ベンチマーク予測</span><b>{Math.round(Object.values(forecast).reduce((n,v)=>n+v,0)/5)}点</b></div>
     <ul className="axis-list">{(Object.keys(scoreLabels) as (keyof typeof forecast)[]).map(k=><li key={k}><span>{scoreLabels[k]}</span><Meter value={forecast[k]} max={99} label={scoreLabels[k]} tone={forecast[k]>=70?'good':forecast[k]>=45?'accent':'warn'}/><b>{forecast[k]}</b></li>)}</ul></div>}
    <p className="hint">学習完了後、{aiBalance.preparationDays}日間の評価準備を経てベンチマークが確定します。データ品質が低いと学習に失敗することがあります。</p>
   </Stage>
   <section className="card design-controls">
    <PanelPages labels={['構造','データ','学習']}>
     <div><div className="form-grid"><label>アーキテクチャ<select value={design.architecture} onChange={e=>architecture(e.target.value as LLMDesign['architecture'])}><option value="dense">Dense</option><option value="moe" disabled={!moeReady}>MoE{moeReady?'':'（研究が必要）'}</option></select></label>
      <label>Attention<select value={design.attention} onChange={e=>setDesign({...design,attention:e.target.value as LLMDesign['attention']})}><option value="standard">Standard</option><option value="grouped">Grouped KV</option></select></label></div>
      <div className="range-grid">{slider('total')}{slider('active',{disabled:design.architecture==='dense',max:Math.min(range('active').max,design.total/1e9)})}{slider('layers')}{slider('hidden')}</div>
      <p className="hint">総・稼働パラメータを変えると、層数とHidden sizeは整合する値に自動で調整されます。</p></div>
     <div className="range-grid">{slider('tokens')}{slider('context')}{slider('quality')}{slider('diversity')}</div>
     <div className="sales-form"><div className="form-grid"><label>モデル名<input maxLength={80} value={name} onChange={e=>setName(e.target.value)}/></label>
      <label>学習クラスタ<select value={clusterId} onChange={e=>setCluster(e.target.value)}>{state.clusters.map(c=><option key={c.id} value={c.id}>{c.id} · GPU {c.gpus}枚 · VRAM {gb(c.vramBytes)}{clusterBusy(state,c.id)?'（使用中）':''}</option>)}</select></label></div>
      <p className="hint">学習費はデータ費と電気・運用費、設備の減価償却の合計です。開始時に支払います。</p></div>
    </PanelPages>
   </section>
  </div>
  <ActionBar back={back} costLabel="学習費" cost={cost} label="学習を開始" disabled={!!problem||!train||!name.trim()||state.company.cash<cost} onClick={submit}/>
 </section>;
}
const aiHelp:Record<AISlider,string>={
 total:'モデル全体のパラメータ数（B=10億）。多いほど性能が上がり、学習・推論に必要なVRAMも増えます。',
 active:'1トークンの計算に使うパラメータ数。MoEでは総パラメータより少なくでき、計算量を抑えられます。',
 layers:'Transformerの層数。深いほど推論系の性能が上がります。',
 hidden:'各層の幅（Hidden size）。層数とともに稼働パラメータ数と整合している必要があります。',
 context:'学習時に一度に扱うトークン長。長いほど学習の計算量が増えます。推論時はこの長さまで使えます。',
 tokens:'学習に使うデータ量（B=10億トークン）。多いほど性能が上がり、データ費と学習時間が増えます。',
 quality:'学習データの品質。高いほど性能が上がり学習失敗が減りますが、データ費が増えます。',
 diversity:'学習データの多様性。多言語・知識の性能に影響します。',
};

function DeployDesigner({state,model:m,send,back,done}:{state:GameState,model:Model,send:Send,back:ReactNode,done:()=>void}){
 const completed=state.research.completed;const quantReady=completed.includes('ai-quantization-1');
 const [clusterId,setCluster]=useState(m.service?.clusterId??m.clusterId);
 const cluster=state.clusters.find(c=>c.id===clusterId)??state.clusters[0];
 const contexts=aiDesignSliders.context.values.filter(v=>v<=m.design.context);
 const [bits,setBits]=useState<4|8|16>(m.service?.bits??16);
 const [context,setContext]=useState(m.service?.context??Math.min(4096,m.design.context));
 const [batch,setBatch]=useState(m.service?.batch??1);
 const [mode,setMode]=useState<'api'|'subscription'|'open'>(m.service?.mode??'api');
 const quote=aiMarketQuote(state);
 const [apiPrice,setAPIPrice]=useState(m.service?.apiPrice??Math.round(quote.price/10)*10);
 const [subscriptionPrice,setSubscription]=useState(m.service?.subscriptionPrice??500);
 const effects=aiEffects(state);
 let inference:ReturnType<typeof estimateInference>|null=null,error='';
 try{if(cluster)inference=estimateInference(m.design,cluster,bits,context,batch,effects);}catch(e){error=e instanceof Error?e.message:String(e);}
 const hosted=mode!=='open';
 const problem=!cluster?'クラスタがありません':error?error:bits!==16&&!quantReady?'量子化には「AI 量子化」の研究が必要です'
  :hosted&&clusterBusy(state,cluster.id,m.id)?'このクラスタは使用中です。別のクラスタを選んでください。'
  :hosted&&inference&&inference.memoryBytes>cluster.vramBytes?`推論VRAMが不足しています（必要 ${gb(inference.memoryBytes)} / クラスタ ${gb(cluster.vramBytes)}）`:'';
 const daily=hosted&&cluster?Math.ceil(clusterCost(cluster,86400)*Math.exp(-(effects.economics??0))):0;
 const submit=()=>{if(cluster&&send({type:'deployModel',id:m.id,clusterId:cluster.id,bits,context,batch,mode,apiPrice,subscriptionPrice}))done();};
 return <section className="screen designer">
  <div className="workbench">
   <Stage eyebrow="SERVICE STUDIO / AI LAB" kind="ai-model" title={m.name}>
    <div className="preview-metrics"><span>推論メモリ<strong>{inference?gb(inference.memoryBytes):'-'}{cluster?` / ${gb(cluster.vramBytes)}`:''}</strong></span>
     <span>生成速度<strong>{inference?`${Math.round(inference.tokensPerSecond).toLocaleString('ja-JP')} tokens/s`:'-'}</strong></span>
     <span>品質低下<strong>{inference?percent(inference.qualityPenalty):'-'}</strong></span>
     <span>市場API価格<strong>{yen(quote.price)}</strong></span></div>
    {problem?<p role="alert" className="warning">{problem}</p>:<div className="forecast" aria-label="モデル評価"><div className="forecast-head"><span>ベンチマーク</span>{m.service?.enabled&&<Chip tone="good">提供中</Chip>}</div>
     <ul className="axis-list">{(Object.keys(scoreLabels) as (keyof Model['scores'])[]).map(k=><li key={k}><span>{scoreLabels[k]}</span><Meter value={m.scores[k]} max={99} label={scoreLabels[k]}/><b>{m.scores[k]}</b></li>)}</ul></div>}
    <p className="hint">有料サービスはクラスタを専有します。公開ウェイトはクラスタを使わず、認知度と評判が上がります。</p>
   </Stage>
   <section className="card design-controls">
    <PanelPages labels={['推論','販売']}>
     <div><div className="form-grid"><label>推論クラスタ<select value={cluster?.id??''} onChange={e=>setCluster(e.target.value)}>{state.clusters.map(c=><option key={c.id} value={c.id}>{c.id} · VRAM {gb(c.vramBytes)}{clusterBusy(state,c.id,m.id)?'（使用中）':''}</option>)}</select></label>
      <label>量子化ビット<select value={bits} onChange={e=>setBits(Number(e.target.value) as typeof bits)}><option value={16}>16bit</option><option value={8} disabled={!quantReady}>8bit{quantReady?'':'（研究が必要）'}</option><option value={4} disabled={!quantReady}>4bit{quantReady?'':'（研究が必要）'}</option></select></label></div>
      <div className="range-grid"><RangeField label="推論コンテキスト長" format={tokenLength} values={contexts} min={contexts[0]??128} max={m.design.context} step={1} value={context} onChange={setContext} description="1回の推論で扱うトークン長。長いほどKVキャッシュのメモリが増えます。学習時の長さが上限です。"/>
       <RangeField label="バッチサイズ" min={1} max={256} step={1} value={batch} onChange={setBatch} description="同時に処理する要求数。増やすと処理量が上がり、KVキャッシュのメモリも増えます。"/></div></div>
     <div className="sales-form"><label>提供形態<select value={mode} onChange={e=>setMode(e.target.value as typeof mode)}><option value="api">API従量課金</option><option value="subscription">定額プラン</option><option value="open">公開ウェイト（ブランド効果）</option></select></label>
      {mode==='api'&&<RangeField label="API価格 / 100万トークン" unit="円" min={10} max={10000} step={10} value={apiPrice} onChange={setAPIPrice}/>}
      {mode==='subscription'&&<RangeField label="月額プラン価格" unit="円" min={10} max={5000} step={10} value={subscriptionPrice} onChange={setSubscription}/>}
      <p className="hint">市場API価格の目安は{yen(quote.price)}/100万トークンです。</p></div>
    </PanelPages>
   </section>
  </div>
  <ActionBar back={back} costLabel="運用費/日（最大）" cost={daily} label={m.service?.enabled?'サービスを更新':'サービスを開始'} disabled={!!problem} onClick={submit}/>
 </section>;
}
