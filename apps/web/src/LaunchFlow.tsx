import {useEffect,useState} from 'react';
import {presentations,presentationKinds,reviewAxes,reviewAxisLabels,type PresentationKind} from '../../../packages/content/src/market';
import {productCatalog} from '../../../packages/content/src/devices';
import {estimateReview,starsFor} from '../../../packages/sim/src/reception';
import type {GameState,GameCommand} from '../../../packages/sim/src/index';
import type {Product} from '../../../packages/sim/src/types';
import {ProductVisual} from './ProductVisual';
import {Modal,Stars,Meter} from './ui';
import {yen} from './i18n';
import {Logo} from './Logo';

/** Launch: pick a presentation → slides (skippable) → review results. */
export function LaunchFlow({state,product,send,close}:{state:GameState,product:Product,send:(c:GameCommand)=>boolean,close:()=>void}){
 const [kind,setKind]=useState<PresentationKind>('online');
 const [stage,setStage]=useState<'choose'|'slides'|'review'>('choose');
 const [slide,setSlide]=useState(0);
 const forecast=estimateReview(state,product);
 const launched=state.products.find(p=>p.id===product.id);
 function launch(){if(send({type:'launch',id:product.id,presentation:kind}))setStage(kind==='none'?'review':'slides');}
 useEffect(()=>{if(stage!=='slides')return;const id=setInterval(()=>setSlide(n=>n+1),1800);return()=>clearInterval(id);},[stage]);
 useEffect(()=>{if(stage==='slides'&&slide>=3)setStage('review');},[stage,slide]);
 if(stage==='choose')return <Modal title={`${product.name} を発売`} onClose={close} wide>
  <p>発売方法を選んでください。プレゼンテーションは話題性（需要の上乗せ）とファン獲得を高めます。</p>
  <div className="presentation-grid" role="radiogroup" aria-label="発表方法">{presentationKinds.map(k=>{const p=presentations[k];
   return <button key={k} role="radio" aria-checked={kind===k} className={`presentation-card ${kind===k?'selected':''}`} disabled={state.company.cash<p.cost} onClick={()=>setKind(k)}>
    <strong>{p.label}</strong><span>{p.cost?yen(p.cost):'無料'}</span><small>話題性 +{p.hype}% · ファン ×{p.fans}</small></button>;})}</div>
  <p className="hint">予想評価 <Stars value={starsFor(forecast.score)} size="sm"/> {forecast.score}点（発売時の競合状況で確定します）</p>
  <div className="button-row end"><button onClick={close}>キャンセル</button><button className="primary" onClick={launch}>この内容で発売</button></div>
 </Modal>;
 if(stage==='slides'){
  const slides=[
   <div key="0" className="slide hero"><Logo id={state.company.logo} size={72}/><h3>{state.company.name}</h3><p>新製品発表</p></div>,
   <div key="1" className="slide"><ProductVisual product={product}/><h3>{product.name}</h3><p>{productCatalog[product.kind].label}</p></div>,
   <div key="2" className="slide"><h3>性能 {product.performance.toLocaleString('ja-JP')}</h3><p>品質 {Math.round(product.reliability*100)}% · 外観グレード {product.visual?.tier??0}</p><p className="price-tag">{yen(product.price)}</p></div>,
  ];
  return <Modal title={`${presentations[kind].label}：${product.name}`} wide className="presentation">
   <div className="slide-stage" aria-live="polite">{slides[Math.min(slide,2)]}</div>
   <div className="slide-dots">{slides.map((_,i)=><span key={i} className={i===Math.min(slide,2)?'on':''}/>)}</div>
   <div className="button-row end"><button onClick={()=>setStage('review')}>スキップ</button></div>
  </Modal>;
 }
 const review=launched?.review;
 return <Modal title="レビュー結果" onClose={close} wide className="review-result">
  {review?<><div className="review-hero"><ProductVisual product={launched!}/><div><h3>{launched!.name}</h3><Stars value={review.stars} size="lg"/><p className="score"><b>{review.score}</b> / 100</p></div></div>
   <ul className="axis-list">{reviewAxes.map(a=><li key={a}><span>{reviewAxisLabels[a]}</span><Meter value={review.axes[a]} label={reviewAxisLabels[a]} tone={review.axes[a]>=70?'good':review.axes[a]>=45?'accent':'warn'}/><b>{review.axes[a]}</b></li>)}</ul>
   <div className="outlets">{review.outlets.map(o=><article key={o.name}><header><strong>{o.name}</strong><span>{o.score}点</span></header><p>{o.comment}</p></article>)}</div></>
   :<p>レビューはまだ公開されていません。</p>}
  <div className="button-row end"><button className="primary" onClick={close}>閉じる</button></div>
 </Modal>;
}
