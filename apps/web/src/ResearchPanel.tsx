import {useState} from 'react';
import {techCatalog,researchDomains,axisLabels} from '../../../packages/content/src/research';
import {researchPointCost,weeklyResearchPoints} from '../../../packages/sim/src/business';
import {hardwareBalance} from '../../../packages/content/src/hardware';
import type {GameState,GameCommand} from '../../../packages/sim/src/index';
import {domainLabel,techEffectText,domainTechYear} from './research-hints';
/** Research tree browser: spend research points to unlock technologies instantly. */
export function ResearchPanel({state,send}:{state:GameState,send:(c:GameCommand)=>void}){
 const [query,setQuery]=useState('');
 const [category,setCategory]=useState('');
 const [axis,setAxis]=useState('');
 const [view,setView]=useState<'available'|'all'|'done'>('available');
 const [page,setPage]=useState(0);
 const completed=new Set(state.research.completed);
 const filtered=techCatalog.filter(t=>(!category||t.category===category)&&(!axis||t.axis===axis)&&t.label.toLowerCase().includes(query.toLowerCase())
  &&(view==='all'||(view==='done'?completed.has(t.id):!completed.has(t.id)&&t.prerequisites.every(p=>completed.has(p)))))
  .sort((a,b)=>Number(b.axis==='compute'&&b.level===1)-Number(a.axis==='compute'&&a.level===1)||a.level-b.level);
 const count=Math.max(1,Math.ceil(filtered.length/12)),current=Math.min(page,count-1);
 const update=(set:(s:string)=>void,value:string)=>{set(value);setPage(0);};
 const income=weeklyResearchPoints(state,hardwareBalance.researchPerWeek);
 const year=category?domainTechYear(category,state.research.completed):undefined;
 const doneIn=(c:string)=>techCatalog.filter(t=>t.category===c&&completed.has(t.id)).length;
 return <section className="screen research-scene">
  <header className="research-head">
   <div className="rp-balance"><span>研究ポイント</span><strong data-testid="rp-balance">{state.company.researchPoints.toLocaleString('ja-JP')} RP</strong><small>+{income.toLocaleString('ja-JP')} RP / 週</small></div>
   <div className="research-progress"><span>解放済み技術</span><strong>{completed.size} / <span data-testid="tech-count">{techCatalog.length}</span></strong></div>
   {year!==undefined&&<div className="research-progress research-era"><span>{domainLabel(category)} 技術水準</span><strong data-testid="tech-year">{year}年相当</strong><small>2100年が上限</small></div>}
   <div className="pager"><button aria-label="前の研究ページ" disabled={current===0} onClick={()=>setPage(current-1)}>‹</button><span data-testid="research-page">{current+1} / {count} · {filtered.length}件</span><button aria-label="次の研究ページ" disabled={current>=count-1} onClick={()=>setPage(current+1)}>›</button></div>
  </header>
  <div className="chip-row domain-row" role="group" aria-label="研究分野">
   <button aria-pressed={category===''} onClick={()=>update(setCategory,'')}>すべて</button>
   {researchDomains.map(d=><button key={d} aria-pressed={category===d} onClick={()=>update(setCategory,d)}>{domainLabel(d)} <small>{doneIn(d)}</small></button>)}
  </div>
  <div className="research-filters">
   <label>技術を検索<input placeholder="技術を検索" value={query} onChange={e=>update(setQuery,e.target.value)}/></label>
   <label>系統<select value={axis} onChange={e=>update(setAxis,e.target.value)}><option value="">すべて</option>{Object.entries(axisLabels).map(([k,l])=><option key={k} value={k}>{l}</option>)}</select></label>
   <label>表示<select value={view} onChange={e=>{setView(e.target.value as typeof view);setPage(0);}}><option value="available">研究可能</option><option value="all">すべて</option><option value="done">完了済み</option></select></label>
  </div>
  <div className="research-results">{filtered.slice(current*12,(current+1)*12).map(t=>{
   const done=completed.has(t.id),active=state.research.active.find(r=>r.id===t.id),locked=t.prerequisites.some(p=>!completed.has(p));
   const cost=researchPointCost(state,t.id),affordable=state.company.researchPoints>=cost;
   return <article className={`tech-card ${done?'done':locked?'locked':affordable?'ready':''}`} data-testid="research-card" key={t.id}>
    <span className="tech-domain">{domainLabel(t.category)} · 第{t.generation}世代</span>
    <h3>{t.label}</h3>
    <p className="tech-effect">{techEffectText(t,state.research.completed)}</p>
    {locked&&<small className="muted">前提：{t.prerequisites.join(' / ')}</small>}
    <div className="tech-foot">{!done&&<span className={`rp-cost ${affordable?'':'short'}`}>{cost.toLocaleString('ja-JP')} RP</span>}
     <button className={done?'':'primary'} aria-label={done||active||locked?undefined:`${t.label} を研究`} disabled={done||!!active||locked||!affordable} onClick={()=>send({type:'research',id:t.id})}>{done?'完了':active?'研究中':locked?'前提研究が必要':'研究する'}</button></div>
    {active&&<progress max={t.work} value={t.work-active.remaining}/>}
   </article>;})}</div>
 </section>;
}
