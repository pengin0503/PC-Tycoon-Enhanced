import { t as uiText } from './i18n';
import { useState } from 'react';
import { hardwareKinds, type HardwareKind } from '../../../packages/content/src/research';
import { defaultSpec, hardwareCatalog, type Spec } from '../../../packages/content/src/hardware';
import type { GameState, GameCommand } from '../../../packages/sim/src/index';
import {ProductCards} from './ProductCards';
export function HardwarePanel({ state, send }: {
    state: GameState;
    send: (c: GameCommand) => void;
}) {
    const [kind, setKind] = useState<HardwareKind>('cpu');
    const [spec, setSpec] = useState<Spec>(defaultSpec('cpu'));
    const [name, setName] = useState(uiText("ui_acf33c7e2636"));
    const [price, setPrice] = useState(400);
    return <><section className="card"><h2>{uiText("ui_59174bb0db0a")}</h2><p>{uiText("ui_760cc9cbde4c")}</p><div className="form-grid"><label>{uiText("ui_0b4587077bbd")}<select value={kind} onChange={e => { const k = e.target.value as HardwareKind; setKind(k); setSpec(defaultSpec(k)); }}>{hardwareKinds.map(k => <option key={k} value={k}>{hardwareCatalog[k].label}</option>)}</select></label><label>{uiText("ui_77e39f7fb46b")}<input maxLength={80} value={name} onChange={e => setName(e.target.value)}/></label>{Object.entries(hardwareCatalog[kind].fields).map(([key, f]) => <label key={key}>{f.label}{f.options ? <select value={spec[key]} onChange={e => setSpec({ ...spec, [key]: e.target.value })}>{f.options.map(v => <option key={v}>{v}</option>)}</select> : <input type="number" min={f.min} max={f.max} step={f.step} value={spec[key]} onChange={e => setSpec({ ...spec, [key]: Number(e.target.value) })}/>}</label>)}<label>{uiText("ui_7fbd0b3bdbca")}<input type="number" min={1} max={1000000} value={price} onChange={e => setPrice(Number(e.target.value))}/></label></div><button className="primary" disabled={!state.research.completed.includes(`${kind}-compute-1`)} onClick={() => send({ type: 'design', kind, name, spec, price })}>{uiText("ui_2391273578b2")}</button></section>
 <section className="card"><h2>{uiText("ui_d5698fe460cf")}</h2><ProductCards state={state} send={send} kinds={[...hardwareKinds]}/>{!state.products.length&&<p>{uiText("ui_061d7a4520fa")}</p>}</section></>;
}
