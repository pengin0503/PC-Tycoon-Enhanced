import {useEffect,useRef,useState} from 'react';
import {command,createGame,type GameState,type GameCommand} from '../../../packages/sim/src/index';
import {exportSave,importSave} from '../../../packages/save/src/index';
import {SaveRepository} from '../../../packages/save/src/repository';
import {ja,eventLabel,yen} from './i18n';
import './styles.css';
import {HardwarePanel} from './HardwarePanel';
import {ResearchPanel} from './ResearchPanel';
import {DevicesPanel} from './DevicesPanel';
import {OSPanel} from './OSPanel';

export default function App(){
 const [state,setState]=useState<GameState|null>(null);const [loading,setLoading]=useState(true);
 const [name,setName]=useState('新しい技術企業');const [year,setYear]=useState(2026);const [seed,setSeed]=useState(42);
 const [difficulty,setDifficulty]=useState<'normal'|'hard'>('normal');const [speed,setSpeed]=useState(0);
 const [error,setError]=useState('');const [notice,setNotice]=useState('');
 const [slots,setSlots]=useState<{id:string,day:number,name:string}[]>([]);
 const [tab,setTab]=useState('company');
 const repo=useRef(new SaveRepository());const writer=useRef(Promise.resolve());const current=useRef(state);current.current=state;
 const report=(e:unknown)=>setError(e instanceof Error?e.message.slice(0,240):String(e));
 function save(snapshot:GameState,manual=false){
  writer.current=writer.current.catch(()=>{}).then(()=>repo.current.save(snapshot)).then(()=>{if(manual)setNotice('保存しました');}).catch(report);
  return writer.current;
 }
 useEffect(()=>{let alive=true;repo.current.latest().then(s=>{if(alive)setState(s);}).catch(e=>{if(alive)report(e);}).finally(()=>{if(alive)setLoading(false);});return()=>{alive=false;};},[]);
 useEffect(()=>{if(state&&!loading)void save(state);},[state,loading]);
 useEffect(()=>{if(!speed)return;const id=setInterval(()=>{if(document.visibilityState==='visible'&&current.current){try{setState(command(current.current,{type:'advance',days:speed}));}catch(e){report(e);setSpeed(0);}}},1000);return()=>clearInterval(id);},[speed]);
 function send(c:GameCommand){if(!state)return;try{setError('');setState(command(state,c));}catch(e){report(e);}}
 function start(){try{setState(createGame({id:crypto.randomUUID(),name,year,difficulty,seed}));setSpeed(0);setError('');setSlots([]);}catch(e){report(e);}}
 async function readFile(file?:File){if(!file)return;try{if(file.size>5*1024*1024)throw new Error('セーブは5 MiB以内にしてください');const s=importSave(await file.text());setState(s);setSpeed(0);setError('');setNotice('読み込みました');}catch(e){report(e);}}
 function download(){if(!state)return;const url=URL.createObjectURL(new Blob([exportSave(state)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`pc-tycoon-${state.id}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 async function list(){try{await writer.current;setSlots(await repo.current.list());}catch(e){report(e);}}
 async function load(id:string){try{await writer.current;const s=await repo.current.load(id);if(s){setState(s);setSpeed(0);setSlots([]);setError('');}}catch(e){report(e);}}
 return <div className="app-shell"><aside className="sidebar"><div className="brand"><span className="brand-mark">P<span>T</span></span><div>PC TYCOON<small>ENHANCED</small></div></div><p className="sidebar-label">TECH COMPANY SIMULATOR</p><nav aria-label="主な画面">{[['company','会社概要'],['hardware','ハードウェア'],['research','研究'],['devices','PCビルダー'],['os','OS']].map(([id,label])=><button key={id} disabled={!state} className={tab===id?'selected':''} onClick={()=>setTab(id)}>{label}</button>)}</nav><p className="side-note">架空の経営シミュレーション<br/>すべての性能・費用はゲーム内数値です。</p></aside><main>
 <header><div><p className="eyebrow">BUILD YOUR NEXT GENERATION</p><h1>{state?.company.name??'技術企業を、ここから。'}</h1></div>{state&&<span className="date">{state.year+Math.floor(state.day/360)}年 · {ja.day} <b data-testid="day">{state.day}</b> / {ja[state.difficulty]}</span>}</header>
 {error&&<div role="alert" className="error">{error}</div>}<div role="status" className="notice">{notice}</div>
 {loading?<p>セーブを確認しています…</p>:!state?<section className="card start-card"><h2>新しい会社</h2><p>研究と製品開発で、次の技術世代を切り拓こう。</p><div className="form-grid"><label>{ja.name}<input value={name} maxLength={80} onChange={e=>setName(e.target.value)}/></label><label>{ja.year}<input type="number" min={1970} max={2200} value={year} onChange={e=>setYear(Number(e.target.value))}/></label><label>{ja.seed}<input type="number" min={0} max={4294967295} value={seed} onChange={e=>setSeed(Number(e.target.value))}/></label><label>{ja.difficulty}<select value={difficulty} onChange={e=>setDifficulty(e.target.value as 'normal'|'hard')}><option value="normal">{ja.normal}</option><option value="hard">{ja.hard}</option></select></label></div><button className="primary" onClick={start}>{ja.start}</button><label className="file-label">{ja.import}<input type="file" accept="application/json,.json" onChange={e=>void readFile(e.target.files?.[0])}/></label></section>:<>
 <section className="metrics" aria-label="財務概要">{[[ja.cash,state.company.cash,'cash'],[ja.revenue,state.finance.revenue,'revenue'],[ja.expenses,state.finance.expenses,'expenses'],[ja.debt,state.company.debt,'debt']].map(([label,value,id])=><article className="metric" key={id}><span>{label}</span><strong data-testid={String(id)}>{yen(Number(value))}</strong></article>)}</section>
 <section className="card time-controls"><div><h2>会社の時間</h2><p>1か月は30日。非表示の間は進行を停止します。</p></div><div className="button-row"><button aria-pressed={speed===0} onClick={()=>setSpeed(0)}>{ja.pause}</button><button aria-pressed={speed===1} onClick={()=>setSpeed(1)}>1x</button><button aria-pressed={speed===7} onClick={()=>setSpeed(7)}>7x</button><button onClick={()=>send({type:'advance',days:1})}>{ja.one}</button><button onClick={()=>send({type:'advance',days:30})}>{ja.month}</button></div></section>
 {tab==='devices'&&<DevicesPanel state={state} send={send}/>} {tab==='os'&&<OSPanel state={state} send={send}/>} {tab==='research'&&<ResearchPanel state={state} send={send}/>} {tab==='hardware'&&<HardwarePanel state={state} send={send}/>}
 <div className="dashboard-grid"><section className="card"><p className="eyebrow">OPERATIONS</p><h2>経営の基盤</h2><p>月次固定費 ￥12,000。支払不足は債務として記録され、収益から返済します。</p><dl><dt>ブランド認知</dt><dd>{state.company.awareness.toFixed(0)} / 100</dd><dt>評判</dt><dd>{state.company.reputation.toFixed(0)} / 100</dd><dt>設備投資</dt><dd>{yen(state.finance.capital)}</dd></dl></section><section className="card"><p className="eyebrow">ACTIVITY</p><h2>イベント履歴</h2><ul className="events">{state.events.filter(e=>e.kind!=='daily').slice(-10).reverse().map((e,i)=><li key={`${e.day}-${i}`}><span>{e.day}日</span>{eventLabel(e.kind)}{e.detail&&<small>{e.detail}</small>}</li>)}{!state.events.length&&<li>時間を進めると、経営の動きが記録されます。</li>}</ul></section></div>
 <section className="card"><h2>セーブと設定</h2><div className="button-row"><button onClick={()=>{setError('');void save(state,true);}}>{ja.save}</button><button onClick={()=>void list()}>{ja.load}</button><button onClick={download}>{ja.export}</button><button onClick={()=>{setState(null);setSpeed(0);}}>{ja.newGame}</button></div><label className="file-label">{ja.import}<input type="file" accept="application/json,.json" onChange={e=>{void readFile(e.target.files?.[0]);e.target.value='';}}/></label>{slots.map(s=><div className="slot" key={s.id}><span>{s.name} · {s.day}日</span><button onClick={()=>void load(s.id)}>再開</button></div>)}</section>
 </>}
 </main></div>;
}
