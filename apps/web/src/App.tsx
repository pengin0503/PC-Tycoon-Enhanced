import { t as uiText } from './i18n';
import { useEffect, useRef, useState } from 'react';
import { command, createGame, type GameState, type GameCommand } from '../../../packages/sim/src/index';
import { importSave } from '../../../packages/save/src/index';
import { SaveRepository } from '../../../packages/save/src/repository';
import { ja, eventLabel, yen } from './i18n';
import './styles.css';
import './landscape.css';
import './android-game.css';
import { HardwarePanel } from './HardwarePanel';
import { ResearchPanel } from './ResearchPanel';
import { DevicesPanel } from './DevicesPanel';
import { OSPanel } from './OSPanel';
import { ManagementPanel } from './ManagementPanel';
import { AIPanel } from './AIPanel';
import { FinancePanel } from './FinancePanel';
import { OfficeScene } from './OfficeScene';
import { monthlyCosts } from '../../../packages/sim/src/management';
import {useOfflineStatus} from './pwa';
import {downloadGame} from './save-export';
import {screens,screenFromHash,type Screen} from './navigation';
import {ScreenIcon} from './ScreenIcon';
export default function App() {
    const offlineStatus=useOfflineStatus();
    const [state, setState] = useState<GameState | null>(null);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState(uiText("ui_3605ed779438"));
    const [year, setYear] = useState(2026);
    const [seed, setSeed] = useState(42);
    const [difficulty, setDifficulty] = useState<'normal' | 'hard'>('normal');
    const [speed, setSpeed] = useState(0);
    const [uiScale,setUIScale]=useState(()=>{try{const n=Number(localStorage.getItem('pc-tycoon-ui-scale'));return n>=50&&n<=150?n:100;}catch{return 100;}});
    useEffect(()=>{try{localStorage.setItem('pc-tycoon-ui-scale',String(uiScale));}catch{}},[uiScale]);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [slots, setSlots] = useState<{
        id: string;
        day: number;
        name: string;
    }[]>([]);
    const [tab, setTab] = useState<Screen>(()=>screenFromHash());
    const nativePaused=useRef(false);
    const repo = useRef(new SaveRepository());
    const writer = useRef(Promise.resolve());
    const current = useRef(state);
    current.current = state;
    useEffect(()=>{if(state?.pendingDecision)setSpeed(0);},[state?.pendingDecision]);
    const report = (e: unknown) => setError(e instanceof Error ? e.message.slice(0, 240) : String(e));
    function save(snapshot: GameState, manual = false) {
        writer.current = writer.current.catch(() => { }).then(() => repo.current.save(snapshot)).then(() => { if (manual)
            setNotice(uiText("ui_1faa5f3254c0")); }).catch(report);
        return writer.current;
    }
    useEffect(() => { let alive = true; repo.current.latest().then(s => { if (alive) {
        setState(s);
        if (repo.current.warnings.length)
            setNotice(repo.current.warnings.join(" / "));
    } }).catch(e => { if (alive)
        report(e); }).finally(() => { if (alive)
        setLoading(false); }); return () => { alive = false; }; }, []);
    useEffect(() => { if (state && !loading)
        void save(state); }, [state, loading]);
    useEffect(()=>{const pause=()=>{nativePaused.current=true;};const resume=()=>{nativePaused.current=false;};document.addEventListener('pause',pause);document.addEventListener('resume',resume);return()=>{document.removeEventListener('pause',pause);document.removeEventListener('resume',resume);};},[]);
    useEffect(() => { if (!speed)
        return; const id = setInterval(() => { if (document.visibilityState === 'visible' && !nativePaused.current && current.current) {
        try {
            const before=current.current;const after=command(before, { type: 'advance', days: speed });notifyUpdates(before,after);setState(after);
        }
        catch (e) {
            report(e);
            setSpeed(0);
        }
    } }, 1000); return () => clearInterval(id); }, [speed]);
    useEffect(()=>{const sync=()=>{setTab(screenFromHash());document.getElementById('game-main')?.scrollTo({top:0});};window.addEventListener('hashchange',sync);return()=>window.removeEventListener('hashchange',sync);},[]);
    function navigate(screen:Screen){setTab(screen);const hash='#/'+screen;if(window.location.hash!==hash)window.location.hash=hash;document.getElementById('game-main')?.scrollTo({top:0});}
    useEffect(()=>{const back=()=>{const el=document.activeElement;if(el instanceof HTMLInputElement||el instanceof HTMLTextAreaElement){el.blur();return;}
      if(screenFromHash()!=='company'){if(window.history.length>1){window.history.back();}else{window.location.hash='#/company';}}
    };window.addEventListener('pct:back',back);return()=>window.removeEventListener('pct:back',back);},[]);
    function notifyUpdates(before:GameState,after:GameState){const known=new Set(before.events.map(e=>`${e.day}/${e.kind}/${e.detail}`));const latest=after.events.filter(e=>['rivalLaunch','marketEvent','researchComplete','designComplete'].includes(e.kind)&&!known.has(`${e.day}/${e.kind}/${e.detail}`)).at(-1);if(latest)setNotice(`${eventLabel(latest.kind)}: ${latest.detail}`);}
    function send(c: GameCommand) { if (!state)
        return; try {
        setError('');
        const next=command(state,c);notifyUpdates(state,next);setState(next);
    }
    catch (e) {
        report(e);
    } }
    function start() { try {
        setState(createGame({ id: crypto.randomUUID(), name, year, difficulty, seed }));navigate('company');
        setSpeed(0);
        setError('');
        setSlots([]);
    }
    catch (e) {
        report(e);
    } }
    async function readFile(file?: File) { if (!file)
        return; try {
        if (file.size > 5 * 1024 * 1024)
            throw new Error(uiText("ui_6da1a0707d77"));
        const s = importSave(await file.text());
        setState(s);
        setSpeed(0);
        setError('');
        setNotice(uiText("ui_0d4f7fc305b0"));
    }
    catch (e) {
        report(e);
    } }
    async function download() { if (!state) return; try {await downloadGame(state);setNotice(ja.exported);} catch(e){report(e);} }
    async function list() { try {
        await writer.current;
        setSlots(await repo.current.list());
    }
    catch (e) {
        report(e);
    } }
    async function load(id: string) { try {
        await writer.current;
        const s = await repo.current.load(id);
        if (s) {
            setState(s);
            setSpeed(0);
            setSlots([]);
            setError('');
        }
    }
    catch (e) {
        report(e);
    } }
    return <div className="app-shell" style={{width:`${10000/uiScale}%`,height:`${10000/uiScale}%`,transform:`scale(${uiScale/100})`,transformOrigin:'top left'}}><main id="game-main" className="game-main" data-native-scene={Boolean(state)}>
 <header><div><p className="eyebrow">PC TYCOON ENHANCED · BUILD YOUR NEXT GENERATION</p><h1>{state?.company.name ?? uiText("ui_b468eb328323")}</h1></div>{state && <span className="date">{state.year + Math.floor(state.day / 360)}{uiText("ui_6d332ee4da56")}{ja.day} <b data-testid="day">{state.day}</b> / {ja[state.difficulty]}</span>}</header>
 {offlineStatus && <p className="offline-status">{ja[offlineStatus]}</p>}
 {error && <div role="alert" className="error">{error}</div>}<div role="status" className="notice">{notice}</div>
 {loading ? <p>{uiText("ui_54d9d6c50126")}</p> : !state ? <section className="card start-card"><h2>{uiText("ui_28aa4eb4f421")}</h2><p>{uiText("ui_686c00bd7eca")}</p><div className="form-grid"><label>{ja.name}<input value={name} maxLength={80} onChange={e => setName(e.target.value)}/></label><label>{ja.year}<input type="number" min={1970} max={2200} value={year} onChange={e => setYear(Number(e.target.value))}/></label><label>{ja.seed}<input type="number" min={0} max={4294967295} value={seed} onChange={e => setSeed(Number(e.target.value))}/></label><label>{ja.difficulty}<select value={difficulty} onChange={e => setDifficulty(e.target.value as 'normal' | 'hard')}><option value="normal">{ja.normal}</option><option value="hard">{ja.hard}</option></select></label></div><button className="primary" onClick={start}>{ja.start}</button><label className="file-label">{ja.import}<input type="file" accept="application/json,.json" onChange={e => void readFile(e.target.files?.[0])}/></label></section> : <><div className="game-hud">
 <section className="metrics" aria-label={uiText("ui_26e0c104ffac")}>{[[ja.cash, state.company.cash, 'cash'], [ja.revenue, state.finance.revenue, 'revenue'], [ja.expenses, state.finance.expenses, 'expenses'], [ja.debt, state.company.debt, 'debt']].map(([label, value, id]) => <article className="metric" key={id}><span>{label}</span><strong data-testid={String(id)}>{yen(Number(value))}</strong></article>)}</section>
 <section className="card time-controls" aria-label="時間操作"><div className="button-row"><button aria-label={ja.pause} title={ja.pause} aria-pressed={speed===0} onClick={()=>setSpeed(0)}>⏸</button><button aria-label="1x" title="1倍速" aria-pressed={speed===1} onClick={()=>setSpeed(1)}>▶</button><button aria-label="7x" title="7倍速" aria-pressed={speed===7} onClick={()=>setSpeed(7)}>⏩</button><button aria-label={ja.one} title={ja.one} onClick={()=>send({type:'advance',days:1})}>+1</button><button aria-label={ja.month} title={ja.month} onClick={()=>send({type:'advance',days:30})}>+30</button><button aria-label={ja.save} title={ja.save} onClick={()=>{setError('');void save(state,true);}}>▣</button><button aria-label="UIサイズ設定" title="UIサイズ設定" onClick={()=>navigate('save')}>⚙</button></div></section></div>
 {tab === 'finance' && <FinancePanel state={state}/>} {tab === 'ai' && <AIPanel state={state} send={send}/>} {tab === 'management' && <ManagementPanel state={state} send={send}/>} {tab === 'devices' && <DevicesPanel state={state} send={send}/>} {tab === 'os' && <OSPanel state={state} send={send}/>} {tab === 'research' && <ResearchPanel state={state} send={send}/>} {tab === 'hardware' && <HardwarePanel state={state} send={send}/>}
 {tab === 'company' && <div className="dashboard-grid"><section className="card"><p className="eyebrow">OPERATIONS</p><h2>稼働状況</h2><OfficeScene state={state}/><p>{uiText("ui_a2b84be82c3a")}{yen(monthlyCosts(state))}{uiText("ui_b7305ca20932")}</p><dl><dt>{uiText("ui_f3b4a72770ee")}</dt><dd>{state.company.awareness.toFixed(0)} / 100</dd><dt>{uiText("ui_f92b36134b35")}</dt><dd>{state.company.reputation.toFixed(0)} / 100</dd><dt>{uiText("ui_2494f99ade6c")}</dt><dd>{yen(state.finance.capital)}</dd></dl></section><section className="card"><p className="eyebrow">ACTIVITY</p><h2>{uiText("ui_f56d9a9a2060")}</h2><ul className="events">{state.events.filter(e => e.kind !== 'daily').slice(-10).reverse().map((e, i) => <li key={`${e.day}-${i}`}><span>{e.day}{uiText("ui_15917f3b3261")}</span>{eventLabel(e.kind)}{e.detail && <small>{e.detail}</small>}</li>)}{!state.events.length && <li>{uiText("ui_498a5b386911")}</li>}</ul></section></div>}
 {tab === 'save' && <section className="card"><h2>{uiText("ui_afca5a836652")}</h2><label className="ui-scale-setting">UIサイズ（50～150%）<input aria-label="UIサイズ" type="range" min={50} max={150} step={10} value={uiScale} onChange={e=>setUIScale(Number(e.target.value))}/><output>{uiScale}%</output></label><div className="button-row"><button onClick={() => void list()}>{ja.load}</button><button onClick={download}>{ja.export}</button><button onClick={() => { setState(null); setSpeed(0); }}>{ja.newGame}</button></div><label className="file-label">{ja.import}<input type="file" accept="application/json,.json" onChange={e => { void readFile(e.target.files?.[0]); e.target.value = ''; }}/></label>{slots.map(s => <div className="slot" key={s.id}><span>{s.name} · {s.day}{uiText("ui_15917f3b3261")}</span><button onClick={() => void load(s.id)}>{uiText("ui_cde3eb972d17")}</button></div>)}</section>}
 </>}
 </main>{state?.pendingDecision&&<div className="decision-overlay"><section className="decision-modal" role="dialog" aria-modal="true" aria-labelledby="decision-heading"><p className="eyebrow">MANAGEMENT DECISION</p><h2 id="decision-heading">{state.pendingDecision.title}</h2><p>{state.pendingDecision.description}</p><p>投資費用：{yen(state.pendingDecision.cost)} · 現金：{yen(state.company.cash)}</p><div className="button-row"><button className="primary" disabled={state.company.cash<state.pendingDecision.cost||state.company.debt>0} onClick={()=>send({type:'eventDecision',choice:'invest'})}>投資する</button><button onClick={()=>send({type:'eventDecision',choice:'ignore'})}>見送る</button></div></section></div>}<nav className="screen-nav" aria-label="ゲームメニュー">{screens.map(screen=><button key={screen.id} disabled={!state} className={tab===screen.id?"selected":""} aria-current={tab===screen.id?"page":undefined} onClick={()=>navigate(screen.id)}><ScreenIcon id={screen.id}/><span>{screen.label}</span></button>)}</nav></div>;
}
