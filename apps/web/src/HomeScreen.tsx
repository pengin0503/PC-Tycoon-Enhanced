import {offices,distributionLabels} from '../../../packages/content/src/management';
import {hardwareBalance} from '../../../packages/content/src/hardware';
import {achievementLabelMap} from '../../../packages/content/src/achievements';
import {monthlyCosts} from '../../../packages/sim/src/management';
import {weeklyResearchPoints} from '../../../packages/sim/src/business';
import type {GameState} from '../../../packages/sim/src/index';
import type {Screen} from './navigation';
import {OfficeScene} from './OfficeScene';
import {Meter,Empty} from './ui';
import {yen,eventLabel} from './i18n';

const quiet=new Set(['daily','weekly','sales','monthly','expense']);
export function HomeScreen({state,go}:{state:GameState,go:(s:Screen)=>void}){
 const developing=state.products.filter(p=>p.remaining>0);
 const waiting=state.products.filter(p=>p.remaining===0&&!p.launched);
 const training=state.models.filter(m=>m.status==='training');
 const office=offices[state.officeLevel-1];
 return <section className="screen home-screen">
  <div className="office-stage"><OfficeScene state={state}/>
   <div className="facility-chips"><button onClick={()=>go('upgrades')}>🏢 {office.label} <b>Lv.{state.officeLevel}</b></button><button onClick={()=>go('upgrades')}>🏭 工場 <b>Lv.{state.factoryLevel}</b></button><button onClick={()=>go('upgrades')}>🏬 {distributionLabels[state.distributionLevel]}</button><button onClick={()=>go('staff')}>👥 {state.staff.length}/{office.staffCapacity}名</button></div>
  </div>
  <aside className="home-side">
   <section className="card"><h2>稼働状況</h2>
    {developing.map(p=><div key={p.id} className="job"><span>🛠 {p.name}</span><Meter value={Math.max(0,20-p.remaining)} max={Math.max(20,p.remaining)} label={`${p.name} 開発進捗`}/></div>)}
    {training.map(m=><div key={m.id} className="job"><span>🧠 {m.name}</span><Meter value={1-Math.max(m.remainingSeconds/m.initialSeconds,m.preparationRemaining/7)} max={1} tone="good" label={`${m.name} 学習進捗`}/></div>)}
    {waiting.length>0&&<button className="primary wide" onClick={()=>go('products')}>🚀 発売待ち {waiting.length}製品</button>}
    {state.offers.length>0&&<button className="wide" onClick={()=>go('companies')}>📨 大口取引の打診 {state.offers.length}件</button>}
    {!developing.length&&!training.length&&!waiting.length&&<p>進行中の開発はありません。<button className="link" onClick={()=>go('develop')}>新製品を開発する</button></p>}
    <dl className="stat-grid"><dt>研究ポイント</dt><dd>+{weeklyResearchPoints(state,hardwareBalance.researchPerWeek).toLocaleString('ja-JP')}/週</dd><dt>月額固定費</dt><dd>{yen(monthlyCosts(state))}</dd><dt>認知度</dt><dd>{state.company.awareness.toFixed(0)} / 100</dd><dt>評判</dt><dd>{state.company.reputation.toFixed(0)} / 100</dd></dl>
   </section>
   <section className="card"><h2>最近の出来事</h2>
    {state.events.some(e=>!quiet.has(e.kind))?<ul className="events">{state.events.filter(e=>!quiet.has(e.kind)).slice(-8).reverse().map((e,i)=><li key={`${e.day}-${i}`}><span>{e.day}日</span>{eventLabel(e.kind)}<small>{e.kind==='achievement'?achievementLabelMap[e.detail]??e.detail:e.detail}</small></li>)}</ul>:<Empty>まだ記録はありません。</Empty>}
   </section>
  </aside>
 </section>;
}
