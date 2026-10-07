import {useState} from 'react';
import {techCatalog} from '../../../packages/content/src/research';
import type {GameState,GameCommand} from '../../../packages/sim/src/index';
import {yen} from './i18n';
export function ResearchPanel({state,send}:{state:GameState,send:(c:GameCommand)=>void}){
 const [query,setQuery]=useState('');
 return <section className="card"><h2>技術研究</h2><p>研究枠を使い、週次で進行します。研究効果は製品性能に反映されます。</p><label>技術を検索<input value={query} onChange={e=>setQuery(e.target.value)}/></label><div className="grid-list" style={{marginTop:20}}>{techCatalog.filter(t=>t.label.toLowerCase().includes(query.toLowerCase())).slice(0,60).map(t=>{
 const done=state.research.completed.includes(t.id);const active=state.research.active.find(r=>r.id===t.id);const locked=t.prerequisites.some(p=>!state.research.completed.includes(p));
 return <article className="card" key={t.id}><h3>{t.label}</h3><p>{yen(t.cost)} · 作業量 {t.work}</p><p>性能効果 +{Math.round(t.effect*100)}%</p>{active&&<progress max={t.work} value={t.work-active.remaining}/>}<button disabled={done||!!active||locked||state.research.active.length>=1} onClick={()=>send({type:'research',id:t.id})}>{done?'研究済み':active?'研究中':locked?'前提研究が必要':`${t.label} を研究`}</button></article>;
 })}</div></section>;
}
