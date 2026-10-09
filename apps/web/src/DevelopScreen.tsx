import {useState} from 'react';
import {hardwareKinds,unlockedVisualTier,techById,type HardwareKind} from '../../../packages/content/src/research';
import {defaultSpec,hardwareCatalog,fieldRange,fieldOptions,hardwareBalance,type Spec} from '../../../packages/content/src/hardware';
import {productCatalog,deviceBalance,deviceCooling} from '../../../packages/content/src/devices';
import {osFeatures,osFeatureLabels,osFeatureResearch,lockScreens,lockScreenLabels,osThemes,osSliders,type OSFeature,type OSSlider} from '../../../packages/content/src/os';
import {unlockedRange,canUnlockMore,type RangeSpec} from '../../../packages/content/src/unlocks';
import {reviewAxisLabels,reviewAxes} from '../../../packages/content/src/market';
import {evaluateHardware} from '../../../packages/sim/src/hardware';
import {evaluateDevice,evaluateOS,deviceCoolingProblem} from '../../../packages/sim/src/devices';
import {benchmarkDevice} from '../../../packages/sim/src/benchmark';
import {osRequirements} from '../../../packages/sim/src/os';
import {estimateReview,starsFor} from '../../../packages/sim/src/reception';
import {researchPointCost,hasRole} from '../../../packages/sim/src/business';
import {developmentCost} from '../../../packages/sim/src/development-cost';
import {visualFinishCost,type VisualChoice} from '../../../packages/sim/src/visual';
import {priceRange} from '../../../packages/sim/src/pricing';
import {vendorPartsAt} from '../../../packages/sim/src/vendor-market';
import type {GameState,GameCommand} from '../../../packages/sim/src/index';
import type {Product} from '../../../packages/sim/src/types';
import {PanelPages} from './PanelPages';
import {ProductIllustration} from './ProductIllustration';
import {RangeField,formatValue,formatScore} from './RangeField';
import {TermHelp,hardwareExplanations} from './HardwareTerms';
import {Stars,Meter,Chip} from './ui';
import {yen} from './i18n';
import {describeWithResearch,researchHint,domainTechYear} from './research-hints';
import {useBackHandler} from './app-gestures';

type Send=(c:GameCommand)=>boolean;
/** Lock marker for a slider whose absolute bound still needs research. */
export function lockFor(field:RangeSpec,range:{min:number,max:number},category:string){
 if(!canUnlockMore(field,range))return undefined;
 return {value:Number(field.lowerIsBetter?field.min:field.max),side:field.lowerIsBetter?'min' as const:'max' as const,hint:researchHint(category,field.unlock!.axes)};
}
type Category=HardwareKind|'pc'|'laptop'|'os';
const categories:Category[]=[...hardwareKinds,'pc','laptop','os'];
const colors=[['graphite','グラファイト'],['silver','シルバー'],['teal','ティール']] as const;

function Forecast({state,draft}:{state:GameState,draft:Parameters<typeof estimateReview>[1]}){
 const {score,axes}=estimateReview(state,draft);
 return <div className="forecast" aria-label="評価予測"><div className="forecast-head"><span>評価予測</span><Stars value={starsFor(score)}/><b>{score}点</b></div>
  <ul className="axis-list">{reviewAxes.map(a=><li key={a}><span>{reviewAxisLabels[a]}</span><Meter value={axes[a]} label={reviewAxisLabels[a]} tone={axes[a]>=70?'good':axes[a]>=45?'accent':'warn'}/><b>{Math.round(axes[a])}</b></li>)}</ul></div>;
}

/** Bottom bar of every designer (products and AI): back, the cost of starting, and the start button. */
export function ActionBar({cost,disabled,label,onClick,note,back,costLabel='開発費'}:{cost:number,disabled:boolean,label:string,onClick:()=>void,note?:string,back:React.ReactNode,costLabel?:string}){
 return <div className="action-bar">{back}<span>{costLabel} <b>{yen(cost)}</b>{note&&<small>{note}</small>}</span><button className="primary big" disabled={disabled} onClick={onClick}>{label}</button></div>;
}

export function DevelopScreen({state,send,go}:{state:GameState,send:Send,go:(screen:'products')=>void}){
 const [category,setCategory]=useState<Category|null>(null);
 useBackHandler(()=>{setCategory(null);return true;},category!==null,70);
 const done=()=>{setCategory(null);go('products');};
 if(category===null)return <section className="screen develop-home"><header className="screen-title"><h2>新製品を開発</h2><p>カテゴリを選んで仕様とデザインを決めます。未解放のカテゴリは研究ポイントで解放できます。</p></header>
  <div className="category-grid">{categories.map(k=>{
   const ready=state.research.completed.includes(`${k}-compute-1`);const cost=researchPointCost(state,`${k}-compute-1`);
   const count=state.products.filter(p=>p.kind===k).length;
   return <article key={k} className={`category-tile ${ready?'':'locked'}`}>
    <div className="tile-art"><ProductIllustration kind={k} tier={0} color="silver"/></div>
    <h3>{productCatalog[k].label}</h3>
    {ready?<><small>{count?`${count}製品`:'未開発'}</small><button className="primary" aria-label={`${productCatalog[k].label}を設計`} onClick={()=>setCategory(k)}>設計する</button></>
     :<><small>🔒 研究が必要</small><button aria-label={`${productCatalog[k].label}を解放`} disabled={state.company.researchPoints<cost||!hasRole(state,'research')} onClick={()=>send({type:'research',id:`${k}-compute-1`})}>解放 {cost.toLocaleString('ja-JP')} RP</button></>}
   </article>;})}</div></section>;
 const back=<button className="back-button" onClick={()=>setCategory(null)}>← カテゴリ選択</button>;
 if(category==='os')return <OSDesigner state={state} send={send} back={back} done={done}/>;
 if(category==='pc'||category==='laptop')return <DeviceDesigner key={category} kind={category} state={state} send={send} back={back} done={done}/>;
 return <ComponentDesigner key={category} kind={category} state={state} send={send} back={back} done={done}/>;
}

function VisualPicker({state,kind,visual,setVisual}:{state:GameState,kind:string,visual:VisualChoice,setVisual:(v:VisualChoice)=>void}){
 const available=unlockedVisualTier(state.research.completed,kind);
 return <div className="design-picker">
  <h3>外観グレード</h3>
  <div className="tier-row" role="group" aria-label="外観グレード">{Array.from({length:6},(_,i)=><button key={i} type="button" disabled={i>available} aria-pressed={visual.tier===i} onClick={()=>setVisual({...visual,tier:i})}>
   <ProductIllustration kind={kind} tier={i} color={visual.color}/><span>グレード {i}{i>available?' 🔒':''}</span></button>)}</div>
  {available<5&&<p className="hint">「{kind.toUpperCase()} 外観」研究で次のグレードが解放されます（+{yen(visualFinishCost(1))}/台）。</p>}
  <h3>カラー</h3>
  <div className="swatch-row" role="group" aria-label="外装カラー">{colors.map(([c,label])=><button key={c} type="button" className={`swatch ${c}`} aria-pressed={visual.color===c} onClick={()=>setVisual({...visual,color:c})}>{label}</button>)}</div>
 </div>;
}

function ComponentDesigner({kind,state,send,back,done}:{kind:HardwareKind,state:GameState,send:Send,back:React.ReactNode,done:()=>void}){
 const definition=hardwareCatalog[kind];
 const [spec,setSpec]=useState<Spec>(defaultSpec(kind));
 const [name,setName]=useState(`${definition.label} 1`);
 const [price,setPrice]=useState(0);
 const [visual,setVisual]=useState<VisualChoice>({tier:0,color:'graphite'});
 const tier=Math.min(visual.tier,unlockedVisualTier(state.research.completed,kind));
 // Metrics are previewed even for an invalid draft (e.g. too little cooling); the problem blocks the start button.
 const preview=evaluateHardware(kind,spec,state.research.completed,{stored:true});
 let problem='';try{evaluateHardware(kind,spec,state.research.completed);}catch(e){problem=e instanceof Error?e.message:String(e);}
 const cooling=typeof spec.cooling==='number'?spec.cooling:undefined;
 const unitCost=preview.unitCost+visualFinishCost(tier);
 const range=priceRange({kind,unitCost,performance:preview.performance,reliability:preview.reliability,visual:{tier}});
 const suggested=Math.round(unitCost*2);
 const designCost=developmentCost(kind,preview.performance,state.day,definition.designCost),engineer=hasRole(state,'engineering');
 const currentPrice=Math.max(range.min,Math.min(range.max,price||suggested));
 const draft={id:'draft',kind,performance:preview.performance,price:currentPrice,unitCost,reliability:preview.reliability,spec,visual:{tier,color:visual.color}};
 const submit=()=>{if(send({type:'design',kind,name,spec,price:currentPrice,visual:{...visual,tier}}))done();};
 return <section className="screen designer">
  <div className="workbench">
   <section className="card product-stage"><p className="eyebrow">DESIGN STUDIO / {definition.label} · <span data-testid="tech-year">技術水準 {domainTechYear(kind,state.research.completed)}年相当</span></p>
    <ProductIllustration kind={kind} tier={tier} color={visual.color} spec={spec}/>
    <h2>{name||definition.label}</h2>
    <div className="preview-metrics"><span>性能スコア<strong>{formatScore(preview.performance)}</strong></span><span>消費電力<strong>{preview.power}W</strong></span>
     {cooling!==undefined&&<span className={preview.power>cooling?'over':''}>冷却性能<strong>{cooling}W</strong></span>}<span>製造原価<strong>{yen(unitCost)}</strong></span><span>品質<strong>{Math.round(preview.reliability*100)}%</strong></span></div>
    {problem?<p role="alert" className="warning">{problem}</p>:<Forecast state={state} draft={draft}/>}
   </section>
   <section className="card design-controls">
    <PanelPages labels={['仕様','デザイン','販売']}>
     <div className="range-grid">{Object.entries(definition.fields).filter(([key])=>key!=='cache').map(([key,field])=>{
      if(field.options){const open=fieldOptions(kind,key,state.research.completed);
       return <label key={key} className="select-field"><span>{field.label}<TermHelp label={field.label} description={describeWithResearch(hardwareExplanations[key],kind,field.optionUnlock?.axes)}/></span><select value={spec[key]} onChange={e=>setSpec({...spec,[key]:e.target.value})}>{field.options.map(v=>{const locked=!open.includes(v);
        return <option key={v} value={v} disabled={locked}>{({none:'直付け',semi:'セミモジュラー',full:'フルモジュラー'} as Record<string,string>)[v]??v}{locked?` 🔒 ${field.optionUnlock?.years[v]??''}年の技術`:''}</option>;})}</select></label>;}
      const range=fieldRange(kind,key,state.research.completed);
      return <RangeField key={key} label={field.label} unit={field.unit} description={describeWithResearch(hardwareExplanations[key],kind,field.unlock?.axes)} min={range.min} max={range.max} step={field.step??1} values={field.values} value={Number(spec[key])} onChange={v=>setSpec({...spec,[key]:v})}
       researchLimit={lockFor(field,range,kind)}/>;
     })}</div>
     <VisualPicker state={state} kind={kind} visual={{...visual,tier}} setVisual={setVisual}/>
     <div className="sales-form"><label>製品名<input maxLength={80} value={name} onChange={e=>setName(e.target.value)}/></label>
      <RangeField label="販売価格" exactInput min={range.min} max={range.max} step={1} value={currentPrice} onChange={setPrice} unit="円"/>
      <p className="hint">原価の約2倍（{yen(suggested)}）が標準的な価格です。設定範囲：{yen(range.min)}～{yen(range.max)}</p></div>
    </PanelPages>
   </section>
  </div>
  <ActionBar back={back} cost={designCost} label="開発を開始" note={!engineer?'開発担当の採用が必要です':undefined} disabled={!!problem||!name.trim()||!engineer||state.company.cash<designCost} onClick={submit}/>
 </section>;
}

const slotLabels={cpu:'CPU',gpu:'GPU',motherboard:'マザーボード',ram:'RAM',storage:'ストレージ',psu:'電源'} as const;
function DeviceDesigner({kind,state,send,back,done}:{kind:'pc'|'laptop',state:GameState,send:Send,back:React.ReactNode,done:()=>void}){
 const [name,setName]=useState(kind==='pc'?'Polar Station':'Polar Book');
 const [purpose,setPurpose]=useState<'gaming'|'office'|'server'>('gaming');
 const [visual,setVisual]=useState<VisualChoice>({tier:0,color:'graphite'});
 const [price,setPrice]=useState(0);
 const [osId,setOS]=useState('');
 const [parts,setParts]=useState<Record<string,string>>({cpu:'v-cpu',gpu:'v-gpu',motherboard:'v-board',ram:'v-ram',storage:'v-storage',psu:''});
 const coolingField=deviceCooling[kind],coolingRange=unlockedRange(coolingField,kind,state.research.completed);
 const [coolingChoice,setCooling]=useState<number>(coolingField.default);
 const cooling=Math.max(coolingRange.min,Math.min(coolingRange.max,coolingChoice));
 const tier=Math.min(visual.tier,unlockedVisualTier(state.research.completed,kind));
 const competitor=state.rivals.filter(r=>!r.acquired).flatMap(r=>r.products.filter(p=>p.remaining===0&&p.launched).map(p=>({...p,supplier:r.name})));
 const chosen=Object.fromEntries(Object.entries(parts).filter(([,v])=>v)) as Record<string,string>;
 let estimate:ReturnType<typeof evaluateDevice>|null=null,problem='';
 try{estimate=evaluateDevice(state,chosen,purpose,kind,osId||undefined,false,cooling,true);}catch(e){problem=e instanceof Error?e.message:String(e);}
 const coolingIssue=estimate?deviceCoolingProblem(state,kind,estimate.power,cooling):'';
 const unitCost=estimate?estimate.unitCost+visualFinishCost(tier):0;
 const designCost=estimate?developmentCost(kind,estimate.performance,state.day,deviceBalance.designCost):deviceBalance.designCost;
 const range=estimate?priceRange({kind,unitCost,performance:estimate.performance,reliability:estimate.reliability,visual:{tier}}):{min:1,max:1};
 const currentPrice=Math.max(range.min,Math.min(range.max,price||Math.round(unitCost*1.6)));
 const synthetic=estimate?{id:'draft',name,kind,spec:{...chosen,purpose,...(osId?{osId}:{})},performance:estimate.performance,power:estimate.power,unitCost,reliability:estimate.reliability,price:currentPrice,remaining:0,inventory:0,target:0,line:false,launched:false,sold:0,revenue:0,profit:0,releaseDay:0,visual:{tier,color:visual.color}} as Product:null;
 const bench=synthetic?benchmarkDevice(state,synthetic):null;
 // PSUs list their rated output; other parts their power draw, which the case cooling has to cover.
 const watts=(p:{kind:string,power:number,spec:Spec})=>p.kind==='psu'?`${p.spec.wattage}W出力`:`${p.power}W`;
 const options=(slot:string)=>[...availableVendors.filter(p=>p.kind===slot).map(p=>({id:p.id,label:`${p.name}（${yen(p.unitCost)} / ${watts(p)}）`})),
  ...state.products.filter(p=>p.kind===slot&&p.remaining===0).map(p=>({id:p.id,label:`自社 ${p.name}（在庫 ${p.inventory} / ${watts(p)}）`})),
  ...competitor.filter(p=>p.kind===slot).map(p=>({id:p.id,label:`${p.supplier} ${p.name}（${yen(p.price)} / 在庫${p.inventory} / ${watts(p)}）`}))];
 const submit=()=>{if(send({type:'assemble',kind,name,parts:chosen as {cpu:string,gpu:string,motherboard:string,ram:string,storage:string,psu?:string},purpose,appearance:visual.color,price:currentPrice,cooling,...(osId?{osId}:{}),visual:{tier,color:visual.color}}))done();};
 return <section className="screen designer">
  <div className="workbench">
   <section className="card product-stage"><p className="eyebrow">PC BUILDER / {productCatalog[kind].label} · <span data-testid="tech-year">技術水準 {domainTechYear(kind,state.research.completed)}年相当</span></p>
    <ProductIllustration kind={kind} color={visual.color} tier={tier}/>
    <h2>{name}</h2>
    {estimate?<><div className="preview-metrics"><span>総合性能<strong>{formatScore(estimate.performance)}</strong></span><span>消費電力<strong>{estimate.power}W</strong></span><span className={estimate.power>cooling?'over':''}>冷却性能<strong>{cooling}W</strong></span><span>製造原価<strong>{yen(unitCost)}</strong></span><span>品質<strong>{Math.round(estimate.reliability*100)}%</strong></span></div>
     {coolingIssue?<p role="alert" className="warning">{coolingIssue}</p>:<Forecast state={state} draft={synthetic!}/>}
     {bench&&<div className="bench-mini"><span>ゲーム性能（高設定）</span>{bench.games.slice(0,3).map(g=><Chip key={g.id} tone={g.playable?'good':'bad'}>{g.name} {g.fps.high}fps</Chip>)}</div>}</>
     :<p role="alert" className="warning">{problem||'部品を確認してください'}</p>}
   </section>
   <section className="card design-controls">
    <PanelPages labels={['部品','冷却','デザイン','販売']}>
     <div className="form-grid">{(Object.keys(slotLabels) as (keyof typeof slotLabels)[]).map(slot=><label key={slot}>{slotLabels[slot]}<select value={parts[slot]} onChange={e=>setParts({...parts,[slot]:e.target.value})}>
      {slot==='psu'&&<option value="">ケース内蔵の汎用電源</option>}{options(slot).map(o=><option key={o.id} value={o.id}>{o.label}</option>)}</select></label>)}
      <label>用途<select value={purpose} onChange={e=>setPurpose(e.target.value as typeof purpose)}><option value="gaming">ゲーミング</option><option value="office">業務</option><option value="server">サーバー</option></select></label>
      <label>OS<select value={osId} onChange={e=>setOS(e.target.value)}><option value="">OSなし</option>{state.products.filter(p=>p.kind==='os'&&p.launched).map(p=><option key={p.id} value={p.id}>{p.name} v{p.spec.version}</option>)}</select></label>
     </div>
     <div className="range-grid"><RangeField label={coolingField.label} unit={coolingField.unit} description={describeWithResearch(`ケースが放熱できる電力（W）。部品の消費電力の合計（現在 ${estimate?.power??'-'}W）を下回ると組み立てられません。余裕があるほど品質が上がり、原価も増えます。`,kind,coolingField.unlock.axes)}
      min={coolingRange.min} max={coolingRange.max} step={coolingField.step} value={cooling} onChange={setCooling} researchLimit={lockFor(coolingField,coolingRange,kind)}/></div>
     <VisualPicker state={state} kind={kind} visual={{...visual,tier}} setVisual={setVisual}/>
     <div className="sales-form"><label>製品名<input maxLength={80} value={name} onChange={e=>setName(e.target.value)}/></label>
      {estimate&&<RangeField label="販売価格" exactInput min={range.min} max={range.max} step={1} value={currentPrice} onChange={setPrice} unit="円"/>}
      <p className="hint">競合部品は製造時に在庫を購入します。電源を指定すると品質が上がり、出力不足は組立できません。</p></div>
    </PanelPages>
   </section>
  </div>
  <ActionBar back={back} cost={designCost} label="組立設計を開始" note={!hasRole(state,'engineering')?'開発担当の採用が必要です':undefined} disabled={!estimate||!!coolingIssue||!name.trim()||!hasRole(state,'engineering')||state.company.cash<designCost} onClick={submit}/>
 </section>;
}

const percent=(n:number)=>`${Math.round(n*100)}%`;
const osSliderHelp:Record<OSSlider,string>={quality:'OSの完成度。高いほど評価と性能が上がり、開発費も増えます。',compatibility:'既存ソフトや周辺機器との互換性。60%以上でブラウザが動作し、高いほど搭載PCの性能が上がります。',support:'発売後のサポート体制。高いほど評価が上がり、ハッカー攻撃の被害が減りますが、毎月の費用が増えます。'};
function OSDesigner({state,send,back,done}:{state:GameState,send:Send,back:React.ReactNode,done:()=>void}){
 const previous=state.products.filter(p=>p.kind==='os');
 const [name,setName]=useState(previous.at(-1)?.name??'Aurora');
 const latest=Math.max(0,...previous.filter(p=>p.name===name).map(p=>Number(p.spec.version)));
 const [version,setVersion]=useState(latest+1);
 const [features,setFeatures]=useState<OSFeature[]>(['files','calculator','browser']);
 const ranges=Object.fromEntries((Object.keys(osSliders) as OSSlider[]).map(k=>[k,unlockedRange(osSliders[k],'os',state.research.completed)])) as Record<OSSlider,{min:number,max:number}>;
 const [sliders,setSliders]=useState<Record<OSSlider,number>>({quality:osSliders.quality.default,compatibility:osSliders.compatibility.default,support:osSliders.support.default});
 const value=(k:OSSlider)=>Math.max(ranges[k].min,Math.min(ranges[k].max,sliders[k]));
 const quality=value('quality'),compatibility=value('compatibility'),support=value('support');
 const [lockScreen,setLock]=useState<typeof lockScreens[number]>('aurora');const [theme,setTheme]=useState<typeof osThemes[number]>('teal');
 const [price,setPrice]=useState(0);
 let result:ReturnType<typeof evaluateOS>|null=null,problem='';
 try{result=evaluateOS(state,{name,version,features,quality,compatibility,support,price:1,lockScreen,theme});}catch(e){problem=e instanceof Error?e.message:String(e);}
 const range=result?priceRange(result):{min:1,max:1};
 const currentPrice=Math.max(range.min,Math.min(range.max,price||hardwareBalance.osReferencePrice));
 const req=osRequirements({spec:{features:features.join(','),version}});
 const toggle=(f:OSFeature)=>setFeatures(features.includes(f)?features.filter(x=>x!==f):[...features,f]);
 const submit=()=>{if(send({type:'developOS',name,version,features,quality,compatibility,support,price:currentPrice,lockScreen,theme}))done();};
 return <section className="screen designer">
  <div className="workbench">
   <section className="card product-stage"><p className="eyebrow">OS STUDIO</p>
    <ProductIllustration kind="os" tier={0} color="silver" spec={{theme}}/>
    <h2>{name} v{version}</h2>
    {result?<><div className="preview-metrics"><span>OS評価<strong>{result.performance.toLocaleString('ja-JP')}</strong></span><span>ライセンス原価<strong>{yen(result.unitCost)}</strong></span><span>開発費<strong>{yen(result.designCost)}</strong></span></div>
     <Forecast state={state} draft={{id:'draft',...result,price:currentPrice}}/></>:<p role="alert" className="warning">{problem}</p>}
    <p className="hint">動作要件：CPU性能 {req.cpu} / RAM {formatValue(req.ram,'GB')} / ストレージ {formatValue(req.storage,'GB')}。満たさないPCに搭載すると性能が下がります。</p>
   </section>
   <section className="card design-controls">
    <PanelPages labels={['機能','品質','デザイン','販売']}>
     <div><div className="feature-grid" role="group" aria-label="搭載機能">{osFeatures.map(f=>{const need=osFeatureResearch[f];const locked=!!need&&!state.research.completed.includes(need);
      return <label key={f} className={`feature-toggle ${locked?'locked':''}`}><input type="checkbox" disabled={locked} checked={features.includes(f)} onChange={()=>toggle(f)}/>{osFeatureLabels[f]}{locked&&<small>🔒 {techById.get(need)?.label??need}</small>}</label>;})}</div>
      <p className="hint">機能を増やすと魅力が上がり、動作要件も重くなります。セキュリティ機能はハッカー攻撃の被害を半減します。</p></div>
     <div className="range-grid">{(Object.keys(osSliders) as OSSlider[]).map(k=>{const field=osSliders[k];
      return <RangeField key={k} label={field.label} format={percent} description={describeWithResearch(osSliderHelp[k],'os',field.unlock.axes)} min={ranges[k].min} max={ranges[k].max} step={field.step} value={value(k)} onChange={v=>setSliders({...sliders,[k]:v})} researchLimit={lockFor(field,ranges[k],'os')}/>;})}</div>
     <div className="design-picker"><h3>ロック画面</h3><div className="wallpaper-row" role="group" aria-label="ロック画面">{lockScreens.map(w=><button key={w} type="button" className={`wallpaper ${w}`} aria-pressed={lockScreen===w} onClick={()=>setLock(w)}><span>{lockScreenLabels[w]}</span></button>)}</div>
      <h3>テーマカラー</h3><div className="swatch-row" role="group" aria-label="テーマカラー">{osThemes.map(t=><button key={t} type="button" className={`swatch theme-${t}`} aria-pressed={theme===t} onClick={()=>setTheme(t)}>{t}</button>)}</div></div>
     <div className="sales-form"><div className="form-grid"><label>OS名<input value={name} maxLength={80} onChange={e=>setName(e.target.value)}/></label><label>バージョン<input type="number" min={1} max={100} value={version} onChange={e=>setVersion(Number(e.target.value))}/></label></div>
      {result&&<RangeField label="ライセンス価格" exactInput min={range.min} max={range.max} step={1} value={currentPrice} onChange={setPrice} unit="円"/>}</div>
    </PanelPages>
   </section>
  </div>
  <ActionBar back={back} cost={result?.designCost??0} label="OS開発を開始" disabled={!result||!name.trim()||!hasRole(state,'engineering')||state.company.cash<(result?.designCost??0)} onClick={submit}/>
 </section>;
}

