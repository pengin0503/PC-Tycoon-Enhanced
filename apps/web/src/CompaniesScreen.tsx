import {useState} from 'react';
import {managementBalance,acquisitionBalance} from '../../../packages/content/src/management';
import {productCatalog} from '../../../packages/content/src/devices';
import {valuation} from '../../../packages/sim/src/rivals';
import {marketShareSummary,type MarketPeriod,type MarketKind} from '../../../packages/sim/src/market-share';
import {acquisitionChance,offerSuccessChance} from '../../../packages/sim/src/business';
import type {GameState,GameCommand} from '../../../packages/sim/src/index';
import {PanelPages} from './PanelPages';
import {Modal,Meter,Chip,Empty,compact} from './ui';
import {Logo} from './Logo';
import {yen} from './i18n';

type Send=(c:GameCommand)=>boolean;
export function CompaniesScreen({state,send}:{state:GameState,send:Send}){
 const [target,setTarget]=useState<string|null>(null);
 const [period,setPeriod]=useState<MarketPeriod>('all');
 const [category,setCategory]=useState<MarketKind>('all');
 const shares=marketShareSummary(state,period,category);
 const pct=(id:string)=>shares.total?`${(shares.shares[id]??0).toFixed(1)}%`:'データなし';
 const [amount,setAmount]=useState(100000000);
 const sold=(r:GameState['rivals'][number])=>r.products.reduce((n,p)=>n+p.sold,0);

 const rival=state.rivals.find(r=>r.id===target);
 const cap=state.difficulty==='hard'?managementBalance.hardLoanCap:managementBalance.normalLoanCap;
 return <section className="screen companies-screen">
  <header className="screen-title"><h2>企業 <small>競合 <span data-testid="competitor-count">{state.rivals.filter(r=>!r.acquired).length}</span>社 · 自社シェア <span data-testid="player-market-share">{shares.player===null?'データなし':`${shares.player.toFixed(1)}%`}</span>（ゲーム内観測販売台数）</small></h2></header>
  <PanelPages labels={['競合',`取引${state.offers.length?`（${state.offers.length}）`:''}`,'資金']}>
   <div><div className="research-filters" aria-label="市場シェア分析条件">
    <label>集計期間<select aria-label="シェア集計期間" value={period} onChange={e=>setPeriod(e.target.value==='all'?'all':Number(e.target.value) as 30|360)}><option value="30">直近30日</option><option value="360">直近360日</option><option value="all">累計</option></select></label>
    <label>製品カテゴリ<select aria-label="シェア製品カテゴリ" value={category} onChange={e=>setCategory(e.target.value as MarketKind)}><option value="all">全製品</option>{Object.entries(productCatalog).map(([key,value])=><option key={key} value={key}>{value.label}</option>)}</select></label>
    <p>観測対象：自社とゲーム内競合のみ（世界市場のシェアではありません）。集計 {shares.total.toLocaleString('ja-JP')}台。旧セーブの期間別履歴は更新後から記録します。</p>
   </div><div className="rival-grid">{state.rivals.map((r,i)=>{const value=valuation(state,r.id);const latest=r.products.filter(p=>p.remaining===0).at(-1);
    return <article key={r.id} className={`rival-card ${r.acquired?'acquired':''}`}>
     <header><Logo id={(i*7+3)%24} size={40}/><div><h3>{r.name}</h3><small>{productCatalog[r.focus].label}専業 · 技術 Lv.{r.researchLevel}</small></div>{r.acquired&&<Chip tone="good">買収済み</Chip>}</header>
     <dl><dt>現金</dt><dd>{yen(r.cash)}</dd><dt>販売台数</dt><dd>{sold(r).toLocaleString('ja-JP')}</dd><dt>最新製品</dt><dd>{latest?`${latest.name}（性能 ${latest.performance} / ${yen(latest.price)}）`:'なし'}</dd><dt>評価額</dt><dd>{yen(value)}</dd></dl>
     <div className="share"><span>市場シェア（{period==='all'?'累計':`直近${period}日`}） <b>{pct(r.id)}</b></span><Meter value={shares.shares[r.id]??0} label={`${r.name} シェア`}/></div>
     {!r.acquired&&<>
      {r.negotiationDay!==undefined&&state.day<r.negotiationDay&&<p className="hint">交渉決裂：{r.negotiationDay}日目まで再交渉できません</p>}
      <button className="primary" onClick={()=>setTarget(r.id)}>買収交渉</button></>}
    </article>;})}</div></div>
   <div>{state.offers.length?<div className="offer-list">{state.offers.map(o=><OfferCard key={o.id} state={state} offer={o} send={send}/>)}</div>
    :<Empty>現在、大口取引の打診はありません。在庫のある製品があると、毎月の確率で買い手から連絡が来ます。</Empty>}</div>
   <div className="upgrade-panel"><h2>資金調達</h2><p>借入残高 {yen(state.company.loan)} / 上限 {yen(cap)} · 月利 {((state.difficulty==='hard'?managementBalance.hardInterest:managementBalance.normalInterest)*100).toFixed(0)}%{state.company.debt>0&&<> · <span className="bad">未払債務 {yen(state.company.debt)}</span></>}</p>
    <div className="form-grid"><label>借入・返済額<input type="number" min={1} value={amount} onChange={e=>setAmount(Number(e.target.value))}/></label></div>
    <div className="button-row"><button onClick={()=>send({type:'borrow',amount})}>借り入れる</button><button onClick={()=>send({type:'repay',amount})}>返済する</button></div>
    <p className="hint">未払債務がある間は生産・広告・新規投資ができません。{state.difficulty==='hard'&&'高難度では月末に未払債務が残ると倒産します。'}</p></div>
  </PanelPages>
  {rival&&<Negotiation state={state} rival={rival} send={send} close={()=>setTarget(null)}/>}
 </section>;
}

function Negotiation({state,rival,send,close}:{state:GameState,rival:GameState['rivals'][number],send:Send,close:()=>void}){
 const value=valuation(state,rival.id);
 const [ratio,setRatio]=useState(85);
 const offer=Math.ceil(value*ratio/100);
 const chance=acquisitionChance(offer,value);
 const locked=rival.negotiationDay!==undefined&&state.day<rival.negotiationDay;
 function bid(){send({type:'acquire',id:rival.id,offer});}
 if(rival.acquired)return <Modal title={`${rival.name} の買収交渉`} onClose={close}><p className="success">買収が成立しました。{rival.name} の製品と技術は自社のものになりました。</p><div className="button-row end"><button className="primary" onClick={close}>閉じる</button></div></Modal>;
 return <Modal title={`${rival.name} の買収交渉`} onClose={close}>
  <p>評価額 <b>{yen(value)}</b>。提示額が低いほど成立しにくく、断られると{acquisitionBalance.cooldownDays}日間交渉できません。買収すると製品・技術・資金・負債を引き継ぎます。</p>
  <label className="range-field"><span className="range-label"><span>提示額（評価額比）</span><output>{ratio}% · {yen(offer)}</output></span>
   <input type="range" aria-label="提示額" min={acquisitionBalance.minimumRatio*100} max={100} step={1} value={ratio} onChange={e=>setRatio(Number(e.target.value))}/></label>
  <div className="chance"><span>成立見込み</span><Meter value={chance*100} tone={chance>.7?'good':chance>.3?'warn':'bad'} label="成立見込み"/><b>{Math.round(chance*100)}%</b></div>
  {locked&&<p className="warning" role="status">{rival.name} は提案を断りました。{rival.negotiationDay}日目まで再交渉できません。</p>}
  <div className="button-row end"><button onClick={close}>やめる</button><button className="primary" disabled={locked||state.company.cash<offer} onClick={bid}>{yen(offer)}を提示</button></div>
 </Modal>;
}

function OfferCard({state,offer,send}:{state:GameState,offer:GameState['offers'][number],send:Send}){
 const [markup,setMarkup]=useState(5);
 const p=state.products.find(x=>x.id===offer.productId);
 if(!p)return null;
 const enough=p.inventory>=offer.quantity;
 return <article className="offer-card"><header><strong>{offer.buyer}</strong><Chip tone="warn">残り {offer.expiresDay-state.day}日</Chip></header>
  <p>{p.name} を <b>{offer.quantity.toLocaleString('ja-JP')}台</b>、1台 <b>{yen(offer.unitPrice)}</b>（定価 {yen(p.price)}）で購入したい。合計 {compact(offer.quantity*offer.unitPrice)}円</p>
  {!enough&&<p className="warning">在庫が不足しています（在庫 {p.inventory}台）</p>}
  <div className="button-row"><button className="primary" disabled={!enough} onClick={()=>send({type:'respondOffer',id:offer.id,action:'accept'})}>承諾</button><button onClick={()=>send({type:'respondOffer',id:offer.id,action:'decline'})}>見送り</button></div>
  <label className="range-field"><span className="range-label"><span>値上げ交渉</span><output>+{markup}% · {yen(Math.round(offer.unitPrice*(1+markup/100)))} · 成功 {Math.round(offerSuccessChance(markup)*100)}%</output></span>
   <input type="range" aria-label={`${offer.buyer} 上乗せ率`} min={1} max={30} step={1} value={markup} onChange={e=>setMarkup(Number(e.target.value))}/></label>
  <button disabled={!enough} onClick={()=>send({type:'respondOffer',id:offer.id,action:'counter',markup})}>値上げを提案</button>
 </article>;
}
