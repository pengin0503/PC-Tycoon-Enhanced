import {Fragment,useState} from 'react';
import {specRows} from './spec-format';
import {productCatalog,productKinds} from '../../../packages/content/src/devices';
import {reviewAxes,reviewAxisLabels,benchmarkPresets} from '../../../packages/content/src/market';
import {benchmarkDevice} from '../../../packages/sim/src/benchmark';
import {osRequirements} from '../../../packages/sim/src/os';
import {reviewDemandFactor} from '../../../packages/sim/src/reception';
import {productDemandForecast} from '../../../packages/sim/src/hardware';
import {eraDemandFactor} from '../../../packages/sim/src/events';
import type {GameState,GameCommand} from '../../../packages/sim/src/index';
import type {Product} from '../../../packages/sim/src/types';
import {PriceEditor,ProductionEditor,StockAllocationEditor} from './ProductEditors';
import {ProductVisual} from './ProductVisual';
import {LaunchFlow} from './LaunchFlow';
import {VirtualDesktop} from './VirtualDesktop';
import {PanelPages} from './PanelPages';
import {Modal,Stars,Meter,Chip,Empty,compact} from './ui';
import {yen} from './i18n';
import {hardwareBalance} from '../../../packages/content/src/hardware';

type Send=(c:GameCommand)=>boolean;
function status(p:Product){
 if(p.discontinuedDay!==undefined)return {label:'販売終了',tone:'muted'};
 if(p.remaining>0)return {label:'開発中',tone:'accent'};
 if(!p.launched)return {label:'発売待ち',tone:'warn'};
 if(p.line)return {label:'生産中',tone:'good'};
 return {label:'販売中',tone:''};
}

export function ProductsScreen({state,send}:{state:GameState,send:Send}){
 const [filter,setFilter]=useState<string>('all');
 const [showEnded,setShowEnded]=useState(true);
 const [openId,setOpen]=useState<string|null>(null);
 const [launchId,setLaunch]=useState<string|null>(null);
 const ended=state.products.filter(p=>p.discontinuedDay!==undefined).length;
 const list=state.products.filter(p=>(filter==='all'||p.kind===filter)&&(showEnded||p.discontinuedDay===undefined)).slice().reverse();
 const open=state.products.find(p=>p.id===openId);
 const launching=state.products.find(p=>p.id===launchId);
 const kinds=productKinds.filter(k=>state.products.some(p=>p.kind===k));
 return <section className="screen products-screen">
  <header className="screen-title"><h2>製品ラインアップ</h2><div className="chip-row" role="group" aria-label="製品の絞り込み">
   <button aria-pressed={filter==='all'} onClick={()=>setFilter('all')}>すべて {state.products.length}</button>
   {kinds.map(k=><button key={k} aria-pressed={filter===k} onClick={()=>setFilter(k)}>{productCatalog[k].label}</button>)}
   {ended>0&&<button aria-pressed={showEnded} onClick={()=>setShowEnded(v=>!v)}>販売終了 {ended}</button>}</div></header>
  {list.length?<div className="product-grid">{list.map(p=>{const st=status(p);return <article key={p.id} className={`product-card${p.discontinuedDay!==undefined?' ended':''}`}>
   <button className="card-hit" aria-label={`${p.name} の詳細`} onClick={()=>setOpen(p.id)}/>
   <ProductVisual product={p}/>
   <div className="product-card-body"><h3>{p.name}</h3><div className="row"><Chip>{productCatalog[p.kind].label}</Chip><Chip tone={st.tone}>{st.label}</Chip></div>
    {p.review?<Stars value={p.review.stars} size="sm"/>:<small className="muted">レビュー未公開</small>}
    {p.remaining>0?<><Meter value={Math.max(0,20-p.remaining)} max={Math.max(20,p.remaining)} label={`${p.name} 開発進捗`}/><small>残り作業 {p.remaining.toFixed(1)}</small></>
     :<p className="card-stats"><span>販売 <b data-testid={`sold-${p.id}`}>{p.sold}</b></span><span>在庫 {p.inventory}</span><span>{yen(p.price)}</span></p>}{p.launched&&p.discontinuedDay===undefined&&<small className="demand-preview">推定週需要：<b data-testid={`demand-${p.id}`}>{productDemandForecast(state,p).toLocaleString('ja-JP')}</b> 台</small>}
    {p.remaining===0&&!p.launched&&<button className="primary" onClick={()=>setLaunch(p.id)}>発売する</button>}
   </div></article>;})}</div>
   :<Empty>まだ製品がありません。「開発」から新製品を設計しましょう。</Empty>}
  {open&&!launching&&<ProductDetail state={state} product={open} send={send} close={()=>setOpen(null)} launch={()=>setLaunch(open.id)}/>}
  {launching&&<LaunchFlow state={state} product={launching} send={send} close={()=>setLaunch(null)}/>}
 </section>;
}

function ProductDetail({state,product:p,send,close,launch}:{state:GameState,product:Product,send:Send,close:()=>void,launch:()=>void}){
 const [desktop,setDesktop]=useState(false);
 const [confirmEnd,setConfirmEnd]=useState(false);
 const onSale=p.launched&&p.discontinuedDay===undefined;
 const device=p.kind==='pc'||p.kind==='laptop';
 const bench=device&&p.remaining===0?benchmarkDevice(state,p):null;
 const specs=specRows(p);
 const labels=['概要',...(specs.length?['仕様']:[]),'レビュー',...(device?['ベンチマーク']:[]),...(p.kind==='os'?['製品・テスト']:[]),...(onSale&&p.kind!=='os'?['在庫配分']:[])];
 const sender=send as (c:GameCommand)=>void;
 const cooling=typeof p.spec.cooling==='number'?p.spec.cooling:undefined;
 const expectedDemand=productDemandForecast(state,p);
 return <Modal title={p.name} onClose={close} onBack={desktop?()=>{setDesktop(false);return true;}:undefined} wide className="product-detail-modal">
  <PanelPages labels={labels}>
   <div className="detail-overview"><ProductVisual product={p}/>
    <dl className="stat-grid"><dt>カテゴリ</dt><dd>{productCatalog[p.kind].label}</dd><dt>性能スコア</dt><dd>{p.performance.toLocaleString('ja-JP')}</dd>
     {p.kind!=='os'&&<><dt>消費電力</dt><dd>{p.power.toLocaleString('ja-JP')}W</dd></>}{cooling!==undefined&&<><dt>冷却性能</dt><dd>{cooling.toLocaleString('ja-JP')}W</dd></>}
     <dt>製造原価</dt><dd>{yen(p.unitCost)}</dd><dt>販売価格</dt><dd>{yen(p.price)}</dd>
     {onSale&&<><dt>推定週需要</dt><dd data-testid="detail-demand">{expectedDemand.toLocaleString('ja-JP')}台</dd></>}<dt>時代需要係数</dt><dd>×{eraDemandFactor(p.kind,state.day).toFixed(2)}</dd>
     <dt>販売数</dt><dd>{p.sold.toLocaleString('ja-JP')}</dd><dt>在庫</dt><dd>{p.inventory}</dd><dt>売上</dt><dd>{yen(p.revenue)}</dd><dt>利益</dt><dd className={p.profit<0?'bad':''}>{yen(p.profit)}</dd>
     {p.hype?<><dt>話題性</dt><dd>+{p.hype.toFixed(0)}%</dd></>:null}{p.review&&<><dt>レビューによる需要</dt><dd>×{reviewDemandFactor(p).toFixed(2)}</dd></>}</dl>
    <div className="detail-actions">
     {p.remaining>0&&<p>開発中：残り作業 {p.remaining.toFixed(1)}</p>}
     {p.remaining===0&&!p.launched&&<button className="primary" onClick={launch}>発売する</button>}
     {p.discontinuedDay!==undefined&&<p className="hint">{p.discontinuedDay}日目に販売終了しました。生産・販売は行われません。</p>}
     {onSale&&p.kind!=='os'&&<ProductionEditor product={p} state={state} send={sender}/>}
      {onSale&&<PriceEditor product={p} state={state} send={sender}/>}
     {onSale&&(confirmEnd?<div className="end-confirm" role="group" aria-label="販売終了の確認">
      <p className="warning">{p.name} の販売を終了します。生産ラインを止め、{p.kind==='os'?'ライセンス販売とサポート費用を停止します':`通常販売できる在庫を定価の${Math.round(hardwareBalance.clearanceShare*100)}%で処分します（自社PCの組立用在庫は残ります）`}。元に戻せません。</p>
      <div className="button-row"><button onClick={()=>setConfirmEnd(false)}>やめる</button><button className="danger" onClick={()=>{if(send({type:'discontinue',id:p.id}))setConfirmEnd(false);}}>販売終了する</button></div></div>
      :<button className="ghost-danger" onClick={()=>setConfirmEnd(true)}>販売終了…</button>)}

    </div>
   </div>
   {specs.length>0&&<div key="spec"><dl className="stat-grid spec-grid">{specs.map(r=><Fragment key={r.key}><dt>{r.label}</dt><dd>{r.value}</dd></Fragment>)}</dl></div>}
   <div>{p.review?<><div className="review-hero"><Stars value={p.review.stars} size="lg"/><p className="score"><b>{p.review.score}</b> 点{p.review.score>100&&<small className="overflow-score">満点超え</small>}</p></div>
    <ul className="axis-list">{reviewAxes.map(a=><li key={a}><span>{reviewAxisLabels[a]}</span><Meter value={p.review!.axes[a]} label={reviewAxisLabels[a]}/><b>{p.review!.axes[a]}</b></li>)}</ul>
    <div className="outlets">{p.review.outlets.map(o=><article key={o.name}><header><strong>{o.name}</strong><span>{o.score}点</span></header><p>{o.comment}</p></article>)}</div></>
    :<Empty>発売するとレビューが公開されます。</Empty>}</div>
   {device&&<div key="bench">{bench?<><div className="metrics small"><article className="metric"><span>CPU</span><strong>{compact(bench.cpu)}</strong></article><article className="metric"><span>GPU</span><strong>{compact(bench.gpu)}</strong></article><article className="metric"><span>メモリ</span><strong>{compact(bench.memory)}</strong></article><article className="metric"><span>ストレージ</span><strong>{compact(bench.storage)}</strong></article></div>
    <table className="bench-table"><caption>ゲームテスト（架空タイトル）{bench.osPenalty&&' — OS動作要件不足'}</caption><thead><tr><th>タイトル</th><th>ジャンル</th>{Object.values(benchmarkPresets).map(x=><th key={x.label}>{x.label}</th>)}</tr></thead>
     <tbody>{bench.games.map(g=><tr key={g.id} className={g.playable?'':'bad'}><td>{g.name}</td><td>{g.genre}</td>{Object.keys(benchmarkPresets).map(k=><td key={k}>{g.fps[k as keyof typeof g.fps]}</td>)}</tr>)}</tbody></table></>
    :<Empty>開発完了後にベンチマークを実行できます。</Empty>}</div>}
   {p.kind==='os'&&<div key="os">{desktop?<VirtualDesktop state={state} os={p} close={()=>setDesktop(false)}/>:<>
    <p>動作要件：CPU {osRequirements(p).cpu} / RAM {osRequirements(p).ram}GB / ストレージ {osRequirements(p).storage}GB</p>
    <button disabled={p.remaining>0} onClick={()=>setDesktop(true)}>操作テスト</button></>}</div>}
   {onSale&&p.kind!=='os'&&<div key="allocation"><StockAllocationEditor product={p} state={state} send={sender}/></div>}
  </PanelPages>
 </Modal>;
}

