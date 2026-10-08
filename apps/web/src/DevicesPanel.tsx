import { t as uiText } from './i18n';
import { useState } from 'react';
import { vendorParts } from '../../../packages/content/src/devices';
import type { GameState, GameCommand } from '../../../packages/sim/src/index';
import { ProductCards } from './ProductCards';
export function DevicesPanel({ state, send }: {
    state: GameState;
    send: (c: GameCommand) => void;
}) {
    const [kind, setKind] = useState<'pc' | 'laptop'>('pc');
    const [name, setName] = useState('Polar Station');
    const [purpose, setPurpose] = useState<'gaming' | 'office' | 'server'>('gaming');
    const [appearance, setAppearance] = useState<'graphite' | 'silver' | 'teal'>('graphite');
    const [price, setPrice] = useState(3000);
    const [osId, setOS] = useState('');
    const [parts, setParts] = useState({ cpu: 'v-cpu', gpu: 'v-gpu', motherboard: 'v-board', ram: 'v-ram', storage: 'v-storage' });
    return <><section className="card"><h2>{uiText("ui_1c7b5d5acd91")}</h2><p>{uiText("ui_7e53bbbed3c2")}</p><div className="form-grid"><label>{uiText("ui_0e2d8e39f29b")}<select value={kind} onChange={e => setKind(e.target.value as typeof kind)}><option value="pc">{uiText("ui_bc1da818428b")}</option><option value="laptop">{uiText("ui_780acc5a3590")}</option></select></label><label>{uiText("ui_1becfb400b82")}<input value={name} onChange={e => setName(e.target.value)}/></label><label>{uiText("ui_7c49c8f25a7a")}<select value={purpose} onChange={e => setPurpose(e.target.value as typeof purpose)}><option value="gaming">{uiText("ui_3993a7a3a529")}</option><option value="office">{uiText("ui_c80df3eec2bb")}</option><option value="server">{uiText("ui_ad2a4879c012")}</option></select></label><label>{uiText("ui_04c647a04713")}<select value={appearance} onChange={e => setAppearance(e.target.value as typeof appearance)}><option>graphite</option><option>silver</option><option>teal</option></select></label>{Object.entries(parts).map(([k, id]) => <label key={k}>{k.toUpperCase()}{uiText("ui_e2df259b2bd2")}<select value={id} onChange={e => setParts({ ...parts, [k]: e.target.value })}>{[...vendorParts, ...state.products.filter(p => p.remaining === 0)].filter(p => p.kind === k).map(p => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}</select></label>)}<label>{uiText("ui_b1df815bc1f3")}<select value={osId} onChange={e => setOS(e.target.value)}><option value="">{uiText("ui_66f94bba6bce")}</option>{state.products.filter(p => p.kind === 'os' && p.launched).map(p => <option key={p.id} value={p.id}>{p.name} v{p.spec.version}</option>)}</select></label><label>{uiText("ui_9568c7834819")}<input type="number" value={price} onChange={e => setPrice(Number(e.target.value))}/></label></div><button className="primary" disabled={!state.research.completed.includes(`${kind}-compute-1`)} onClick={() => send({ type: 'assemble', kind, name, parts, purpose, appearance, price, ...(osId ? { osId } : {}) })}>{uiText("ui_f0e5fd8db49e")}</button></section><ProductCards state={state} send={send} kinds={['pc', 'laptop', 'monitor']}/></>;
}
