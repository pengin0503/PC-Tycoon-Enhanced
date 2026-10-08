import { t as uiText } from './i18n';
import { useState } from 'react';
import { techCatalog, researchDomains, axisLabels } from '../../../packages/content/src/research';
import type { GameState, GameCommand } from '../../../packages/sim/src/index';
import { yen } from './i18n';
import { offices } from '../../../packages/content/src/management';
export function ResearchPanel({ state, send }: {
    state: GameState;
    send: (c: GameCommand) => void;
}) {
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('');
    const [axis, setAxis] = useState('');
    const [page, setPage] = useState(0);
    const filtered = techCatalog.filter(t => (!category || t.category === category) && (!axis || t.axis === axis) && t.label.toLowerCase().includes(query.toLowerCase())).sort((a, b) => Number(b.axis === 'compute' && b.level === 1) - Number(a.axis === 'compute' && a.level === 1));
    const count = Math.max(1, Math.ceil(filtered.length / 12)), current = Math.min(page, count - 1);
    const update = (set: (s: string) => void, value: string) => { set(value); setPage(0); };
    return <section className="card research-scene"><h2>{uiText("ui_f237dda3ef6e")}<span data-testid="tech-count">{techCatalog.length}</span></h2><p>{uiText("ui_cef528f8f847")}</p><div className="form-grid"><label>{uiText("ui_b4e765317d89")}<input value={query} onChange={e => update(setQuery, e.target.value)}/></label><label>{uiText("ui_b29f681318df")}<select value={category} onChange={e => update(setCategory, e.target.value)}><option value="">{uiText("ui_c15ccc4dc740")}</option>{researchDomains.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}</select></label><label>{uiText("ui_037ca6ca32ea")}<select value={axis} onChange={e => update(setAxis, e.target.value)}><option value="">{uiText("ui_c15ccc4dc740")}</option>{Object.entries(axisLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label></div><div className="button-row" style={{ marginTop: 20 }}><button disabled={current === 0} onClick={() => setPage(current - 1)}>{uiText("ui_0ee44e665480")}</button><span data-testid="research-page">{current + 1} / {count} · {filtered.length}{uiText("ui_04d7e6fc2cc7")}</span><button disabled={current >= count - 1} onClick={() => setPage(current + 1)}>{uiText("ui_d76caea229db")}</button></div><div className="grid-list research-results" style={{ marginTop: 8 }}>{filtered.slice(current * 12, (current + 1) * 12).map(t => {
            const done = state.research.completed.includes(t.id);
            const active = state.research.active.find(r => r.id === t.id);
            const locked = t.prerequisites.some(p => !state.research.completed.includes(p));
            return <article className="card" data-testid="research-card" key={t.id}><h3>{t.label}</h3><button disabled={done || !!active || locked || state.research.active.length >= offices[state.officeLevel - 1].researchSlots} onClick={() => send({ type: 'research', id: t.id })}>{done ? uiText("ui_127f177598af") : active ? uiText("ui_deede4c4a356") : locked ? uiText("ui_96f05dae5ac6") : `${t.label} を研究`}</button><p>{yen(t.cost)}{uiText("ui_38d281bde230")}{t.work.toFixed(1)}</p><p>{axisLabels[t.axis]} +{(t.effect * 100).toFixed(1)}%</p><small className="muted">{t.prerequisites.join(' / ') || uiText("ui_4f7a376ab15c")}</small>{active && <progress max={t.work} value={t.work - active.remaining}/>}</article>;
        })}</div></section>;
}
