import { t as uiText } from './i18n';
import { useEffect, useRef, useState } from 'react';
import { command, createGame, type GameState, type GameCommand } from '../../../packages/sim/src/index';
import { exportSave, importSave } from '../../../packages/save/src/index';
import { SaveRepository } from '../../../packages/save/src/repository';
import { ja, eventLabel, yen } from './i18n';
import './styles.css';
import { HardwarePanel } from './HardwarePanel';
import { ResearchPanel } from './ResearchPanel';
import { DevicesPanel } from './DevicesPanel';
import { OSPanel } from './OSPanel';
import { ManagementPanel } from './ManagementPanel';
import { AIPanel } from './AIPanel';
import { FinancePanel } from './FinancePanel';
import { OfficeScene } from './OfficeScene';
import { monthlyCosts } from '../../../packages/sim/src/management';
export default function App() {
    const [state, setState] = useState<GameState | null>(null);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState(uiText("ui_3605ed779438"));
    const [year, setYear] = useState(2026);
    const [seed, setSeed] = useState(42);
    const [difficulty, setDifficulty] = useState<'normal' | 'hard'>('normal');
    const [speed, setSpeed] = useState(0);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [slots, setSlots] = useState<{
        id: string;
        day: number;
        name: string;
    }[]>([]);
    const [tab, setTab] = useState('company');
    const [menuOpen, setMenu] = useState(false);
    const repo = useRef(new SaveRepository());
    const writer = useRef(Promise.resolve());
    const current = useRef(state);
    current.current = state;
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
    useEffect(() => { if (!speed)
        return; const id = setInterval(() => { if (document.visibilityState === 'visible' && current.current) {
        try {
            setState(command(current.current, { type: 'advance', days: speed }));
        }
        catch (e) {
            report(e);
            setSpeed(0);
        }
    } }, 1000); return () => clearInterval(id); }, [speed]);
    function send(c: GameCommand) { if (!state)
        return; try {
        setError('');
        setState(command(state, c));
    }
    catch (e) {
        report(e);
    } }
    function start() { try {
        setState(createGame({ id: crypto.randomUUID(), name, year, difficulty, seed }));
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
    function download() { if (!state)
        return; const url = URL.createObjectURL(new Blob([exportSave(state)], { type: 'application/json' })); const a = document.createElement('a'); a.href = url; a.download = `pc-tycoon-${state.id}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
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
    return <div className="app-shell"><aside className="sidebar"><div className="brand"><span className="brand-mark">P<span>T</span></span><div>PC TYCOON<small>ENHANCED</small></div></div><p className="sidebar-label">TECH COMPANY SIMULATOR</p><button className="mobile-menu-toggle" aria-expanded={menuOpen} onClick={() => setMenu(!menuOpen)}>{uiText("ui_8f99b5f7c588")}</button><nav className={menuOpen ? "menu-open" : ""} aria-label={uiText("ui_3161d4d1bc3b")}>{[['company', uiText("ui_be2b33d39b0d")], ['hardware', uiText("ui_06e225ea8775")], ['research', uiText("ui_b31c66f6eae1")], ['devices', uiText("ui_1c7b5d5acd91")], ['os', 'OS'], ['management', uiText("ui_172297b0f7cb")], ['ai', 'AI Lab'], ['finance', uiText("ui_769fe8df57c5")]].map(([id, label]) => <button key={id} disabled={!state} className={tab === id ? 'selected' : ''} onClick={() => { setTab(id); setMenu(false); }}>{label}</button>)}</nav><p className="side-note">{uiText("ui_b6a935fdbf04")}<br />{uiText("ui_82cec84d5cc5")}</p></aside><main>
 <header><div><p className="eyebrow">BUILD YOUR NEXT GENERATION</p><h1>{state?.company.name ?? uiText("ui_b468eb328323")}</h1></div>{state && <span className="date">{state.year + Math.floor(state.day / 360)}{uiText("ui_6d332ee4da56")}{ja.day} <b data-testid="day">{state.day}</b> / {ja[state.difficulty]}</span>}</header>
 {error && <div role="alert" className="error">{error}</div>}<div role="status" className="notice">{notice}</div>
 {loading ? <p>{uiText("ui_54d9d6c50126")}</p> : !state ? <section className="card start-card"><h2>{uiText("ui_28aa4eb4f421")}</h2><p>{uiText("ui_686c00bd7eca")}</p><div className="form-grid"><label>{ja.name}<input value={name} maxLength={80} onChange={e => setName(e.target.value)}/></label><label>{ja.year}<input type="number" min={1970} max={2200} value={year} onChange={e => setYear(Number(e.target.value))}/></label><label>{ja.seed}<input type="number" min={0} max={4294967295} value={seed} onChange={e => setSeed(Number(e.target.value))}/></label><label>{ja.difficulty}<select value={difficulty} onChange={e => setDifficulty(e.target.value as 'normal' | 'hard')}><option value="normal">{ja.normal}</option><option value="hard">{ja.hard}</option></select></label></div><button className="primary" onClick={start}>{ja.start}</button><label className="file-label">{ja.import}<input type="file" accept="application/json,.json" onChange={e => void readFile(e.target.files?.[0])}/></label></section> : <>
 <section className="metrics" aria-label={uiText("ui_26e0c104ffac")}>{[[ja.cash, state.company.cash, 'cash'], [ja.revenue, state.finance.revenue, 'revenue'], [ja.expenses, state.finance.expenses, 'expenses'], [ja.debt, state.company.debt, 'debt']].map(([label, value, id]) => <article className="metric" key={id}><span>{label}</span><strong data-testid={String(id)}>{yen(Number(value))}</strong></article>)}</section>
 <section className="card time-controls"><div><h2>{uiText("ui_6ceaf2aab9a5")}</h2><p>{uiText("ui_76936b9f606e")}</p></div><div className="button-row"><button aria-pressed={speed === 0} onClick={() => setSpeed(0)}>{ja.pause}</button><button aria-pressed={speed === 1} onClick={() => setSpeed(1)}>1x</button><button aria-pressed={speed === 7} onClick={() => setSpeed(7)}>7x</button><button onClick={() => send({ type: 'advance', days: 1 })}>{ja.one}</button><button onClick={() => send({ type: 'advance', days: 30 })}>{ja.month}</button></div></section>
 {tab === 'finance' && <FinancePanel state={state}/>} {tab === 'ai' && <AIPanel state={state} send={send}/>} {tab === 'management' && <ManagementPanel state={state} send={send}/>} {tab === 'devices' && <DevicesPanel state={state} send={send}/>} {tab === 'os' && <OSPanel state={state} send={send}/>} {tab === 'research' && <ResearchPanel state={state} send={send}/>} {tab === 'hardware' && <HardwarePanel state={state} send={send}/>}
 <div className="dashboard-grid"><section className="card"><p className="eyebrow">OPERATIONS</p><h2>{uiText("ui_ba9406a0d120")}</h2><OfficeScene state={state}/><p>{uiText("ui_a2b84be82c3a")}{yen(monthlyCosts(state))}{uiText("ui_b7305ca20932")}</p><dl><dt>{uiText("ui_f3b4a72770ee")}</dt><dd>{state.company.awareness.toFixed(0)} / 100</dd><dt>{uiText("ui_f92b36134b35")}</dt><dd>{state.company.reputation.toFixed(0)} / 100</dd><dt>{uiText("ui_2494f99ade6c")}</dt><dd>{yen(state.finance.capital)}</dd></dl></section><section className="card"><p className="eyebrow">ACTIVITY</p><h2>{uiText("ui_f56d9a9a2060")}</h2><ul className="events">{state.events.filter(e => e.kind !== 'daily').slice(-10).reverse().map((e, i) => <li key={`${e.day}-${i}`}><span>{e.day}{uiText("ui_15917f3b3261")}</span>{eventLabel(e.kind)}{e.detail && <small>{e.detail}</small>}</li>)}{!state.events.length && <li>{uiText("ui_498a5b386911")}</li>}</ul></section></div>
 <section className="card"><h2>{uiText("ui_afca5a836652")}</h2><div className="button-row"><button onClick={() => { setError(''); void save(state, true); }}>{ja.save}</button><button onClick={() => void list()}>{ja.load}</button><button onClick={download}>{ja.export}</button><button onClick={() => { setState(null); setSpeed(0); }}>{ja.newGame}</button></div><label className="file-label">{ja.import}<input type="file" accept="application/json,.json" onChange={e => { void readFile(e.target.files?.[0]); e.target.value = ''; }}/></label>{slots.map(s => <div className="slot" key={s.id}><span>{s.name} · {s.day}{uiText("ui_15917f3b3261")}</span><button onClick={() => void load(s.id)}>{uiText("ui_cde3eb972d17")}</button></div>)}</section>
 </>}
 </main></div>;
}
