import {useEffect,useRef,useState} from 'react';
import {command,createGame,advanceInteractive,type GameState,type GameCommand} from '../../../packages/sim/src/index';
import {importSave} from '../../../packages/save/src/index';
import {SaveRepository} from '../../../packages/save/src/repository';
import {achievementLabelMap} from '../../../packages/content/src/achievements';
import {ja,eventLabel,yen} from './i18n';
import './game.css';
import {HomeScreen} from './HomeScreen';
import {DevelopScreen} from './DevelopScreen';
import {ProductsScreen} from './ProductsScreen';
import {ResearchPanel} from './ResearchPanel';
import {UpgradesScreen} from './UpgradesScreen';
import {StaffScreen} from './StaffScreen';
import {CompaniesScreen} from './CompaniesScreen';
import {AIPanel} from './AIPanel';
import {FinancePanel} from './FinancePanel';
import {SettingsScreen,modeLabels} from './SettingsScreen';
import {NotificationCenter} from './NotificationCenter';
import {HackerDefense,GameOver,DecisionModal} from './Overlays';
import {useOfflineStatus} from './pwa';
import {downloadGame} from './save-export';
import {navScreens,screenFromHash,type Screen} from './navigation';
import {ScreenIcon} from './ScreenIcon';
import {Logo,logoIds} from './Logo';
import {compact,gameDate} from './ui';
import {dispatchBack} from './app-gestures';

const announced=new Set(['rivalLaunch','marketEvent','researchComplete','designComplete','reviewPublished','offerReceived','hackerAttack','achievement','acquisitionRejected','offerAccepted','offerRejected','gameOver']);
type Mode=GameState['mode'];
const modeHelp:Record<Mode,string>={standard:'標準的な経済バランス。',tycoon:'需要 +20%・研究費 -25% の遊びやすい設定。',long:'研究費 2倍・競合の開発が遅い長期戦。',sandbox:'資金や研究ポイントを自由に設定（実績なし）。'};

export default function App(){
 const offlineStatus=useOfflineStatus();
 const [state,setState]=useState<GameState|null>(null);
 const [loading,setLoading]=useState(true);
 const [name,setName]=useState('新しい技術企業');
 const [year,setYear]=useState(2026);
 const [seed,setSeed]=useState(42);
 const [difficulty,setDifficulty]=useState<'normal'|'hard'>('normal');
 const [mode,setMode]=useState<Mode>('standard');
 const [logo,setLogo]=useState(0);
 const [speed,setSpeed]=useState(0);
 const [showInbox,setShowInbox]=useState(false);
 const [uiScale,setUIScale]=useState(()=>{try{const n=Number(localStorage.getItem('pc-tycoon-ui-scale'));return n>=50&&n<=150?n:100;}catch{return 100;}});
 useEffect(()=>{try{localStorage.setItem('pc-tycoon-ui-scale',String(uiScale));}catch{}},[uiScale]);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const [slots,setSlots]=useState<{id:string,day:number,name:string}[]>([]);
 const [tab,setTab]=useState<Screen>(()=>screenFromHash());
 const nativePaused=useRef(false);
 const repo=useRef(new SaveRepository());
 const writer=useRef(Promise.resolve());
 const current=useRef(state);current.current=state;
 const blocked=!!(state?.pendingDecision||state?.pendingAttack||state?.gameOver);
 useEffect(()=>{if(blocked)setSpeed(0);},[blocked]);
 const report=(e:unknown)=>setError(e instanceof Error?e.message.slice(0,240):String(e));
 useEffect(()=>{if(!notice)return;const id=setTimeout(()=>setNotice(''),4500);return()=>clearTimeout(id);},[notice]);
 function save(snapshot:GameState,manual=false){
  writer.current=writer.current.catch(()=>{}).then(()=>repo.current.save(snapshot)).then(()=>{if(manual)setNotice('保存しました');}).catch(report);
  return writer.current;
 }
 useEffect(()=>{let alive=true;repo.current.latest().then(s=>{if(alive){setState(s);if(repo.current.warnings.length)setNotice(repo.current.warnings.join(' / '));}}).catch(e=>{if(alive)report(e);}).finally(()=>{if(alive)setLoading(false);});return()=>{alive=false;};},[]);
 useEffect(()=>{if(state&&!loading)void save(state);},[state,loading]);
 useEffect(()=>{const pause=()=>{nativePaused.current=true;};const resume=()=>{nativePaused.current=false;};document.addEventListener('pause',pause);document.addEventListener('resume',resume);return()=>{document.removeEventListener('pause',pause);document.removeEventListener('resume',resume);};},[]);
 useEffect(()=>{if(!speed)return;const id=setInterval(()=>{if(document.visibilityState==='visible'&&!nativePaused.current&&current.current){
  try{const before=current.current;const after=advanceInteractive(before,speed);notifyUpdates(before,after);setState(after);}catch(e){report(e);setSpeed(0);}}},1000);return()=>clearInterval(id);},[speed]);
 useEffect(()=>{const sync=()=>{setTab(screenFromHash());document.getElementById('game-main')?.scrollTo({top:0});};window.addEventListener('hashchange',sync);return()=>window.removeEventListener('hashchange',sync);},[]);
 function navigate(screen:Screen){setTab(screen);const hash='#/'+screen;if(window.location.hash!==hash)window.location.hash=hash;document.getElementById('game-main')?.scrollTo({top:0});}
 useEffect(()=>{const back=()=>{const el=document.activeElement;if(el instanceof HTMLInputElement||el instanceof HTMLTextAreaElement||el instanceof HTMLSelectElement){el.blur();return;}
  if(dispatchBack())return;
  if(screenFromHash()!=='home'){if(window.history.length>1)window.history.back();else window.location.hash='#/home';}};
  window.addEventListener('pct:back',back);return()=>window.removeEventListener('pct:back',back);},[]);
 function notifyUpdates(before:GameState,after:GameState){
  const known=new Set(before.events.map(e=>`${e.day}/${e.kind}/${e.detail}`));
  const latest=after.events.filter(e=>announced.has(e.kind)&&!known.has(`${e.day}/${e.kind}/${e.detail}`)).at(-1);
  if(latest)setNotice(`${eventLabel(latest.kind)}: ${latest.kind==='achievement'?achievementLabelMap[latest.detail]??latest.detail:latest.detail}`);
 }
 /** Applies a command; returns false (and shows the reason) when the simulation rejects it. */
 function send(c:GameCommand):boolean{
  if(!state)return false;
  try{setError('');const next=c.type==='advance'?advanceInteractive(state,c.days):command(state,c);notifyUpdates(state,next);setState(next);return true;}
  catch(e){report(e);return false;}
 }
 function start(){try{let s=createGame({id:crypto.randomUUID(),name,year,difficulty,seed,mode});if(logo)s=command(s,{type:'logo',logo});setState(s);setSpeed(0);setError('');setSlots([]);navigate('home');}catch(e){report(e);}}
 async function readFile(file?:File){if(!file)return;try{if(file.size>5*1024*1024)throw new Error('セーブは5 MiB以内にしてください');const s=importSave(await file.text());setState(s);setSpeed(0);setError('');setNotice('JSONを読み込みました');}catch(e){report(e);}}
 async function download(){if(!state)return;try{await downloadGame(state);setNotice(ja.exported);}catch(e){report(e);}}
 async function list(){try{await writer.current;setSlots(await repo.current.list());if(repo.current.warnings.length)setNotice(repo.current.warnings.join(' / '));}catch(e){report(e);if(repo.current.warnings.length)setNotice(repo.current.warnings.join(' / '));}}
 async function load(id:string){try{await writer.current;const s=await repo.current.load(id);if(s){setState(s);setSpeed(0);setSlots([]);setError('');}}catch(e){report(e);}}
 const newGame=()=>{setState(null);setSpeed(0);};
 const badges:Partial<Record<Screen,number>>=state?{products:state.products.filter(p=>p.remaining===0&&!p.launched).length,companies:state.offers.length}:{};
 const unread=state?state.notifications.filter(n=>n.id>state.notificationReadId).length:0;
 const date=state?gameDate(state.year,state.day):null;
 return <div className="app-shell" style={{width:`${10000/uiScale}%`,height:`${10000/uiScale}%`,transform:`scale(${uiScale/100})`,transformOrigin:'top left'}}>
  {state&&<header className="hud">
   <div className="hud-brand"><Logo id={state.company.logo} size={34}/><div><h1>{state.company.name}</h1><span className="date">{date!.year}年{date!.month}月{date!.date}日 · {ja.day} <b data-testid="day">{state.day}</b></span></div></div>
   <div className="hud-resources" aria-label="会社の資源">
    <span className="resource cash" title={ja.cash}><i aria-hidden="true">¥</i><span className="sr-only">{ja.cash}</span><b data-testid="cash">{yen(state.company.cash)}</b></span>
    <span className="resource rp" title="研究ポイント"><i aria-hidden="true">⚗</i><span className="sr-only">研究ポイント</span><b data-testid="rp">{compact(state.company.researchPoints)}</b></span>
    <span className="resource fans" title="ファン"><i aria-hidden="true">♥</i><span className="sr-only">ファン</span><b data-testid="fans">{compact(state.company.fans)}</b></span>
    {state.company.debt>0&&<span className="resource debt" title={ja.debt}><i aria-hidden="true">!</i><span className="sr-only">{ja.debt}</span><b data-testid="debt">{yen(state.company.debt)}</b></span>}
   </div>
   <div className="time-controls" role="group" aria-label="時間操作">
    <button aria-label={ja.pause} title={ja.pause} aria-pressed={speed===0} onClick={()=>setSpeed(0)}>⏸</button>
    <button aria-label="1x" title="1倍速" aria-pressed={speed===1} disabled={blocked} onClick={()=>setSpeed(1)}>▶</button>
    <button aria-label="7x" title="7倍速" aria-pressed={speed===7} disabled={blocked} onClick={()=>setSpeed(7)}>⏩</button>
    <button aria-label={ja.one} title={ja.one} onClick={()=>send({type:'advance',days:1})}>+1</button>
    <button aria-label={ja.month} title={ja.month} onClick={()=>send({type:'advance',days:30})}>+30</button>
    <button aria-label={ja.save} title={ja.save} onClick={()=>{setError('');void save(state,true);}}>💾</button>
    <button aria-label={`通知センター（未読${unread}件）`} title="通知センター" onClick={()=>setShowInbox(v=>!v)}>🔔{unread>0&&<span className="badge" aria-hidden="true">{unread}</span>}</button>
    <button aria-label="セーブ・設定" title="セーブ・設定" aria-pressed={tab==='settings'} onClick={()=>navigate('settings')}><ScreenIcon id="settings" size={18}/></button>
   </div>
  </header>}
  <main id="game-main" className="game-main" data-native-scene={Boolean(state)}>
   {offlineStatus&&<p className="offline-status">{ja[offlineStatus]}</p>}
   {error&&<div role="alert" className="error"><span>{error}</span><button className="icon-button" aria-label="エラーを閉じる" onClick={()=>setError('')}>×</button></div>}
   <div role="status" className="notice">{notice}</div>
   {loading?<p>読み込み中…</p>:!state?<section className="start-card"><div className="start-hero"><Logo id={logo} size={64}/><div><p className="eyebrow">PC TYCOON ENHANCED</p><h1>新しい会社を設立</h1><p>ガレージから世界的テック企業へ。部品を設計し、レビューで評価され、ファンを増やしましょう。</p></div></div>
    <div className="form-grid"><label>{ja.name}<input value={name} maxLength={80} onChange={e=>setName(e.target.value)}/></label><label>{ja.year}<input type="number" min={1970} max={2200} value={year} onChange={e=>setYear(Number(e.target.value))}/></label>
     <label>{ja.difficulty}<select value={difficulty} onChange={e=>setDifficulty(e.target.value as 'normal'|'hard')}><option value="normal">{ja.normal}</option><option value="hard">{ja.hard}（倒産あり）</option></select></label>
     <label>{ja.seed}<input type="number" min={0} max={4294967295} value={seed} onChange={e=>setSeed(Number(e.target.value))}/></label></div>
    <div className="mode-grid" role="radiogroup" aria-label="ゲームモード">{(Object.keys(modeLabels) as Mode[]).map(m=><button key={m} role="radio" aria-checked={mode===m} className={mode===m?'selected':''} onClick={()=>setMode(m)}><strong>{modeLabels[m]}</strong><small>{modeHelp[m]}</small></button>)}</div>
    <div className="logo-grid compact" role="radiogroup" aria-label="ロゴ">{logoIds.map(id=><button key={id} role="radio" aria-checked={logo===id} aria-label={`ロゴ ${id+1}`} onClick={()=>setLogo(id)}><Logo id={id} size={30}/></button>)}</div>
    <div className="button-row"><button className="primary big" onClick={start}>{ja.start}</button><label className="file-label">{ja.import}<input type="file" accept="application/json,.json" onChange={e=>void readFile(e.target.files?.[0])}/></label></div>
   </section>:<>
    {tab==='home'&&<HomeScreen state={state} go={navigate}/>}
    {tab==='develop'&&<DevelopScreen state={state} send={send} go={navigate}/>}
    {tab==='products'&&<ProductsScreen state={state} send={send}/>}
    {tab==='research'&&<ResearchPanel state={state} send={send}/>}
    {tab==='upgrades'&&<UpgradesScreen state={state} send={send}/>}
    {tab==='staff'&&<StaffScreen state={state} send={send}/>}
    {tab==='companies'&&<CompaniesScreen state={state} send={send}/>}
    {tab==='ai'&&<AIPanel state={state} send={send}/>}
    {tab==='stats'&&<FinancePanel state={state}/>}
    {tab==='settings'&&<SettingsScreen state={state} send={send} uiScale={uiScale} setUIScale={setUIScale} list={()=>void list()} slots={slots} load={id=>void load(id)} download={()=>void download()} readFile={f=>void readFile(f)} newGame={newGame}/>}
   </>}
  </main>
  {state&&showInbox&&<NotificationCenter state={state} send={send} close={()=>setShowInbox(false)}/>}
  {state?.gameOver?<GameOver state={state} onNewGame={newGame}/>:state?.pendingDecision?<DecisionModal state={state} send={send}/>:state?.pendingAttack?<HackerDefense key={state.pendingAttack.day} state={state} send={send}/>:null}
  {state&&<nav className="screen-nav" aria-label="ゲームメニュー">{navScreens.map(screen=><button key={screen.id} className={tab===screen.id?'selected':''} aria-current={tab===screen.id?'page':undefined} onClick={()=>navigate(screen.id)}><ScreenIcon id={screen.id}/><span>{screen.label}</span>{(badges[screen.id]??0)>0&&<i className="badge" aria-hidden="true">{badges[screen.id]}</i>}</button>)}</nav>}
 </div>;
}

