import {useEffect,useState} from 'react';
import type {GameState,GameCommand} from '../../../packages/sim/src/index';
import {attackDamage} from '../../../packages/sim/src/os';
import {companyStats} from '../../../packages/sim/src/progress';
import {Modal,compact} from './ui';
import {yen} from './i18n';
import {createForegroundClock} from './foreground-clock';
import {availableForRetail} from '../../../packages/sim/src/inventory-allocation';
import {offerSuccessChance} from '../../../packages/sim/src/business';
import {productCatalog} from '../../../packages/content/src/devices';

type Node='idle'|'active'|'blocked'|'breached';
const appearEvery=700,window_=2600;
/** Tap intrusions before they breach; the blocked count is sent once when the round ends. */
export function HackerDefense({state,send}:{state:GameState,send:(c:GameCommand)=>void}){
 const attack=state.pendingAttack!;const os=state.products.find(p=>p.id===attack.osId);
 const [phase,setPhase]=useState<'intro'|'running'|'done'>('intro');
 const [nodes,setNodes]=useState<Node[]>(()=>Array(attack.targets).fill('idle'));
 useEffect(()=>{if(phase!=='running')return;
  const clock=createForegroundClock(()=>performance.now(),()=>document.visibilityState==='visible');
  const pause=()=>clock.pause(),resume=()=>clock.resume(),visibility=()=>clock.visibilityChanged();
  document.addEventListener('pause',pause);document.addEventListener('resume',resume);document.addEventListener('visibilitychange',visibility);
  const id=setInterval(()=>{const t=clock.elapsed();
   setNodes(prev=>prev.map((n,i)=>n==='idle'&&t>=i*appearEvery?'active':n==='active'&&t>=i*appearEvery+window_?'breached':n));},100);
  return()=>{clearInterval(id);document.removeEventListener('pause',pause);document.removeEventListener('resume',resume);document.removeEventListener('visibilitychange',visibility);};},[phase]);
 useEffect(()=>{if(phase==='running'&&nodes.every(n=>n==='blocked'||n==='breached'))setPhase('done');},[phase,nodes]);
 const blocked=nodes.filter(n=>n==='blocked').length;
 const block=(i:number)=>setNodes(prev=>prev.map((n,k)=>k===i&&n==='active'?'blocked':n));
 return <Modal title="不正アクセス警報" className="hacker">
  <p>{os?.name??'自社OS'} がハッカー攻撃を受けています（対応期限 {attack.deadlineDay}日目）。現れた侵入をタップして遮断してください。</p>
  {phase==='intro'&&<div className="button-row end"><button onClick={()=>send({type:'defendAttack',blocked:0})}>対応しない</button><button className="primary" onClick={()=>setPhase('running')}>防御を開始</button></div>}
  {phase!=='intro'&&<div className="intrusion-grid">{nodes.map((n,i)=><button key={i} className={`intrusion ${n}`} aria-label={`侵入 ${i+1} を遮断`} disabled={n!=='active'} onClick={()=>block(i)}>{n==='blocked'?'🛡':n==='breached'?'⚠':n==='active'?'☠':''}</button>)}</div>}
  {phase==='running'&&<p role="status">遮断 {blocked} / {attack.targets}</p>}
  {phase==='done'&&<><p role="status">遮断 {blocked} / {attack.targets} · 予想被害 {Math.round(attackDamage(os,blocked,attack.targets)*100)}%</p>
   <div className="button-row end"><button className="primary" onClick={()=>send({type:'defendAttack',blocked})}>結果を確定</button></div></>}
 </Modal>;
}

export function GameOver({state,onNewGame}:{state:GameState,onNewGame:()=>void}){
 const stats=companyStats(state);
 return <Modal title="ゲームオーバー" className="game-over">
  <p>{state.gameOver!.reason}（{state.gameOver!.day}日目）</p>
  <dl className="stat-grid"><dt>累計売上</dt><dd>{yen(stats.earned)}</dd><dt>販売台数</dt><dd>{compact(stats.sold)}</dd><dt>ファン</dt><dd>{compact(stats.fans)}</dd><dt>研究</dt><dd>{stats.research}件</dd><dt>実績</dt><dd>{state.achievements.length}</dd></dl>
  <div className="button-row end"><button className="primary" onClick={onNewGame}>新しいゲーム</button></div>
 </Modal>;
}

export function DecisionModal({state,send}:{state:GameState,send:(c:GameCommand)=>void}){
 const d=state.pendingDecision!;
 return <Modal title={d.title} className="decision">
  <p className="eyebrow">経営判断</p><p>{d.description}</p><p>投資費用：{yen(d.cost)} · 現金：{yen(state.company.cash)}</p>
  <div className="button-row end"><button onClick={()=>send({type:'eventDecision',choice:'ignore'})}>見送る</button><button className="primary" disabled={state.company.cash<d.cost||state.company.debt>0} onClick={()=>send({type:'eventDecision',choice:'invest'})}>投資する</button></div>
 </Modal>;
}


/**
 * A bulk-deal offer arrived: time is stopped and the offer fills the screen until the player accepts, declines or
 * counters it (one offer at a time; further pending offers follow).
 */
export function OfferModal({state,send,error}:{state:GameState,send:(c:GameCommand)=>boolean,error?:string}){
 const offer=state.offers[0];const p=state.products.find(x=>x.id===offer.productId);
 const [markup,setMarkup]=useState(5);
 if(!p)return null;
 const retail=availableForRetail(state,p),enough=retail>=offer.quantity;
 const counter=Math.round(offer.unitPrice*(1+markup/100));
 return <Modal title="大口取引の打診" className="offer-event fullscreen">
  <p className="eyebrow">時間を停止しています{state.offers.length>1?` · ほかに${state.offers.length-1}件の打診`:''}</p>
  <div className="offer-hero"><strong>{offer.buyer}</strong><span>{productCatalog[p.kind].label} · {p.name}</span></div>
  <dl className="stat-grid"><dt>数量</dt><dd>{offer.quantity.toLocaleString('ja-JP')}台</dd><dt>提示単価</dt><dd>{yen(offer.unitPrice)}（定価 {yen(p.price)}）</dd>
   <dt>合計</dt><dd>{yen(offer.quantity*offer.unitPrice)}</dd><dt>粗利見込み</dt><dd>{yen(offer.quantity*(offer.unitPrice-p.unitCost))}</dd><dt>販売可能在庫</dt><dd className={enough?'':'bad'}>{retail.toLocaleString('ja-JP')}台（総在庫 {p.inventory.toLocaleString('ja-JP')}台）</dd></dl>
  {!enough&&<p className="warning">在庫が不足しているため承諾できません。見送るか、値上げ交渉も在庫が必要です。</p>}
  {error&&<p role="alert" className="warning">{error}</p>}
  <label className="range-field"><span className="range-label"><span>値上げ交渉</span><output>+{markup}% · {yen(counter)} · 成功 {Math.round(offerSuccessChance(markup)*100)}%</output></span>
   <input type="range" aria-label="値上げ率" min={1} max={30} step={1} value={markup} onChange={e=>setMarkup(Number(e.target.value))}/></label>
  <div className="button-row end"><button onClick={()=>send({type:'respondOffer',id:offer.id,action:'decline'})}>見送る</button>
   <button disabled={!enough} onClick={()=>send({type:'respondOffer',id:offer.id,action:'counter',markup})}>値上げを提案</button>
   <button className="primary" disabled={!enough} onClick={()=>send({type:'respondOffer',id:offer.id,action:'accept'})}>承諾する</button></div>
 </Modal>;
}
