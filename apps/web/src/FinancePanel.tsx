import type {GameState} from '../../../packages/sim/src/index';
import {companyValue} from '../../../packages/sim/src/management';
import {companyStats} from '../../../packages/sim/src/progress';
import {currentUnitCost} from '../../../packages/sim/src/hardware';
import {useState} from 'react';
import {productCatalog,productKinds} from '../../../packages/content/src/devices';
import {tieredAchievements,milestoneAchievements,achievementLabelMap} from '../../../packages/content/src/achievements';
import {PanelPages} from './PanelPages';
import {Stars,compact} from './ui';
import {yen,eventLabel} from './i18n';
import {discontinueHint,monthlyKindSales} from './sales-stats';

function CashChart({state}:{state:GameState}){
 const values=state.history.slice(-24);
 if(!values.length)return <p className="empty">最初の月次決算（30日目）以降に推移が表示されます。</p>;
 const min=Math.min(0,...values.map(v=>v.cash)),max=Math.max(1,...values.map(v=>v.cash));
 const point=(v:number,i:number)=>[60+i*460/Math.max(1,values.length-1),180-(v-min)/(max-min)*140];
 const offset=state.history.length-values.length;
 const revenue=values.map((h,i)=>h.revenue-(i?values[i-1].revenue:state.history[offset-1]?.revenue??0));
 const top=Math.max(1,...revenue);
 return <svg role="img" aria-label="月次現金推移" viewBox="0 0 560 220" className="finance-chart"><title>月次現金推移</title>
  {revenue.map((r,i)=><rect key={'r'+i} x={point(0,i)[0]-6} y={180-r/top*60} width="12" height={r/top*60} fill="#9cc4ff" opacity=".7"><title>{values[i].day}日 売上 {yen(r)}</title></rect>)}
  <line x1="60" x2="520" y1="180" y2="180" stroke="#b9c6d6"/><text x="0" y="45" fill="#6a7a8f" fontSize="10">{compact(max)}</text><text x="0" y="183" fill="#6a7a8f" fontSize="10">{compact(min)}</text>
  <polyline points={values.map((v,i)=>point(v.cash,i).join(',')).join(' ')} fill="none" stroke="#2f7cf6" strokeWidth="3"/>
  {values.map((v,i)=>{const [cx,cy]=point(v.cash,i);return <circle key={v.day} cx={cx} cy={cy} r="4" fill="#2f7cf6"><title>{v.day}日 現金 {yen(v.cash)}</title></circle>;})}
  <text x="60" y="210" fill="#6a7a8f" fontSize="11">{values[0].day}日</text><text x="480" y="210" fill="#6a7a8f" fontSize="11">{values.at(-1)!.day}日</text></svg>;
}

function KindChart({state,kind}:{state:GameState,kind:string}){
 const rows=monthlyKindSales(state.history,kind).slice(-24);
 if(!rows.length)return <p className="empty" data-testid="kind-chart-empty">月次推移のデータなし（この機能の追加以降、2回目の月次決算から表示されます）。</p>;
 const top=Math.max(1,...rows.map(r=>r.sold)),money=Math.max(1,...rows.map(r=>r.revenue));
 const x=(i:number)=>60+i*460/Math.max(1,rows.length-1);
 return <svg role="img" aria-label="種類別の月次販売推移" viewBox="0 0 560 200" className="finance-chart" data-testid="kind-chart"><title>種類別の月次販売推移</title>
  {rows.map((r,i)=><rect key={'u'+r.day} x={x(i)-6} y={160-r.sold/top*120} width="12" height={r.sold/top*120} fill="#9cc4ff" opacity=".8"><title>{r.day}日 販売 {r.sold.toLocaleString('ja-JP')}台</title></rect>)}
  <polyline points={rows.map((r,i)=>`${x(i)},${160-r.revenue/money*120}`).join(' ')} fill="none" stroke="#2f7cf6" strokeWidth="3"/>
  {rows.map((r,i)=><circle key={'r'+r.day} cx={x(i)} cy={160-r.revenue/money*120} r="3.5" fill="#2f7cf6"><title>{r.day}日 売上 {yen(r.revenue)}</title></circle>)}
  <line x1="60" x2="520" y1="160" y2="160" stroke="#b9c6d6"/>
  <text x="4" y="28" fill="#6a7a8f" fontSize="11">最大 {compact(top)}台/月</text><text x="556" y="28" textAnchor="end" fill="#2f7cf6" fontSize="11">最大 ¥{compact(money)}/月</text>
  <text x="60" y="190" fill="#6a7a8f" fontSize="11">{rows[0].day}日</text><text x="520" y="190" textAnchor="end" fill="#6a7a8f" fontSize="11">{rows.at(-1)!.day}日</text>
  <text x="290" y="190" textAnchor="middle" fill="#6a7a8f" fontSize="11">棒：販売台数　線：売上</text></svg>;
}

/** Product performance, filterable by product type, with totals of the selected type. */
function ProductStats({state}:{state:GameState}){
 const [kind,setKind]=useState<string>('all');
 const rivals=state.rivals.filter(r=>!r.acquired);
 const kinds=productKinds.filter(k=>state.products.some(p=>p.kind===k)||rivals.some(r=>r.products.some(p=>p.kind===k)));
 const match=(k:string)=>kind==='all'||k===kind;
 const own=state.products.filter(p=>match(p.kind));
 const others=rivals.flatMap(r=>r.products.filter(p=>match(p.kind)).map(p=>({r,p})));
 const sold=own.reduce((n,p)=>n+p.sold,0),total=sold+others.reduce((n,{p})=>n+p.sold,0);
 return <div>
  <div className="chip-row" role="group" aria-label="製品成績の種類">
   <button aria-pressed={kind==='all'} onClick={()=>setKind('all')}>すべて</button>
   {kinds.map(k=><button key={k} aria-pressed={kind===k} onClick={()=>setKind(k)}>{productCatalog[k].label}</button>)}
  </div>
  <div className="metrics" data-testid="product-stats-summary"><article className="metric"><span>自社製品</span><strong>{own.length}<small> 件（販売中 {own.filter(p=>p.discontinuedDay===undefined).length}）</small></strong></article><article className="metric"><span>累計販売</span><strong>{sold.toLocaleString('ja-JP')}台</strong></article><article className="metric"><span>累計売上</span><strong>{yen(own.reduce((n,p)=>n+p.revenue,0))}</strong></article><article className="metric"><span>累計利益</span><strong className={own.reduce((n,p)=>n+p.profit,0)<0?'bad':''}>{yen(own.reduce((n,p)=>n+p.profit,0))}</strong></article><article className="metric"><span>販売台数シェア</span><strong>{total?(sold/total*100).toFixed(1):'0.0'}%</strong></article></div>
  <KindChart state={state} kind={kind}/>
  <div className="scroll-table"><table><thead><tr><th>製品</th><th>種類</th><th>評価</th><th>性能</th><th>価格</th><th>製造原価</th><th>粗利率</th><th>販売</th><th>売上</th><th>利益</th></tr></thead>
   <tbody>{own.map(p=>{const cost=currentUnitCost(state,p),hint=discontinueHint(state.day,p,cost),margin=p.kind==='os'?undefined:(p.price-cost)/p.price;
    return <tr key={p.id} className={p.discontinuedDay!==undefined?'ended-row':''}><td>{state.company.name} / {p.name}{p.discontinuedDay!==undefined&&<span className="chip muted">販売終了</span>}{hint&&<span className="chip warn" data-testid="discontinue-hint" title="販売終了を検討">終了検討：{hint}</span>}</td><td>{productCatalog[p.kind].label}</td><td>{p.review?<Stars value={p.review.stars} size="sm"/>:'—'}</td><td>{p.performance}</td><td>{yen(p.price)}</td><td>{yen(cost)}</td><td className={margin!==undefined&&margin<0?'bad':''}>{margin===undefined?'—':`${Math.round(margin*100)}%`}</td><td>{p.sold}</td><td>{yen(p.revenue)}</td><td className={p.profit<0?'bad':''}>{yen(p.profit)}</td></tr>;})}
    {others.map(({r,p})=><tr key={`${r.id}-${p.id}`} className="rival-row"><td>{r.name} / {p.name}{p.discontinuedDay!==undefined&&<span className="chip muted">販売終了</span>}</td><td>{productCatalog[p.kind].label}</td><td>—</td><td>{p.performance}</td><td>{yen(p.price)}</td><td>—</td><td>—</td><td>{p.sold}</td><td>{yen(p.revenue)}</td><td>{yen(p.profit)}</td></tr>)}
    {!own.length&&!others.length&&<tr><td colSpan={10} className="empty">この種類の製品はまだありません。</td></tr>}</tbody></table></div>
 </div>;
}

/** Statistics: finance, product performance, market log and achievements. */
export function FinancePanel({state}:{state:GameState}){
 const stats=companyStats(state);
 const unlocked=new Map(state.achievements.map(a=>[a.id,a.day]));
 return <section className="screen stats-screen"><PanelPages labels={['財務','製品成績','市場','実績']}>
  <div><div className="metrics"><article className="metric"><span>企業価値</span><strong>{yen(companyValue(state))}</strong></article><article className="metric"><span>累計損益</span><strong>{yen(state.finance.revenue-state.finance.expenses)}</strong></article><article className="metric"><span>年間売上</span><strong>{yen(stats.yearRevenue)}</strong></article><article className="metric"><span>決算月数</span><strong data-testid="finance-months">{state.history.length}</strong></article></div>
   <CashChart state={state}/>
   <div className="scroll-table"><table><caption>月次決算</caption><thead><tr><th>日</th><th>現金</th><th>月間売上</th><th>月間費用</th><th>借入</th><th>シェア</th></tr></thead>
    <tbody>{state.history.map((h,i)=>{const prev=state.history[i-1];const known=!!prev||h.day===30;return <tr key={h.day}><td>{h.day}</td><td>{yen(h.cash)}</td><td>{known?yen(h.revenue-(prev?.revenue??0)):'—'}</td><td>{known?yen(h.expenses-(prev?.expenses??0)):'—'}</td><td>{yen(h.loan)}</td><td>{(h.share*100).toFixed(1)}%</td></tr>;}).slice(-24).reverse()}</tbody></table></div></div>
  <ProductStats state={state}/>
  <div><p>需要係数 ×{state.modifiers.demand.toFixed(2)} · 生産係数 ×{state.modifiers.production.toFixed(2)} · 効果終了 {state.modifiers.expiresDay||'—'}日{state.osIncident&&` · OS需要 ×${state.osIncident.demand.toFixed(2)}（${state.osIncident.expiresDay}日まで）`}</p>
   <ul className="events">{state.events.filter(e=>!['daily','weekly','sales'].includes(e.kind)).slice(-60).reverse().map((e,i)=><li key={`${e.day}-${i}`}><span>{e.day}日</span>{eventLabel(e.kind)}<small>{e.kind==='achievement'?achievementLabelMap[e.detail]??e.detail:e.detail}</small></li>)}</ul></div>
  <div>{state.mode==='sandbox'&&<p className="warning">サンドボックスモードでは実績を獲得できません。</p>}
   <p>獲得実績 <b>{state.achievements.length}</b> / {tieredAchievements.reduce((n,t)=>n+t.tiers.length,0)+milestoneAchievements.length}</p>
   <div className="achievement-grid">{tieredAchievements.map(t=>t.tiers.map((v,i)=>{const id=`${t.metric}-${i+1}`;const day=unlocked.get(id);
    return <article key={id} className={`achievement ${day!==undefined?'unlocked':''}`}><span className="medal" aria-hidden="true">{day!==undefined?'🏆':'🔒'}</span><div><strong>{t.label}</strong><small>{compact(v)}{t.unit}{day!==undefined?` · ${day}日目`:` · 現在 ${compact(stats[t.metric])}`}</small></div></article>;}))}
    {milestoneAchievements.map(m=>{const day=unlocked.get(m.id);return <article key={m.id} className={`achievement ${day!==undefined?'unlocked':''}`}><span className="medal" aria-hidden="true">{day!==undefined?'🏅':'🔒'}</span><div><strong>{m.label}</strong><small>{m.description}{day!==undefined?` · ${day}日目`:''}</small></div></article>;})}</div></div>
 </PanelPages></section>;
}
