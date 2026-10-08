import {PanelPages} from './PanelPages';
import { t as uiText } from './i18n';
import { useState } from 'react';
import type { GameState, GameCommand } from '../../../packages/sim/src/index';
import { osApps } from '../../../packages/sim/src/devices';
import { ProductCards } from './ProductCards';
export function OSPanel({ state, send }: {
    state: GameState;
    send: (c: GameCommand) => void;
}) {
    const [name, setName] = useState('Aurora');
    const [version, setVersion] = useState(1);
    const [features, setFeatures] = useState<('files' | 'calculator' | 'browser')[]>(['files', 'calculator', 'browser']);
    const [quality, setQuality] = useState(.9);
    const [compatibility, setCompatibility] = useState(.9);
    const [support, setSupport] = useState(.8);
    const [price, setPrice] = useState(50);
    const [preview, setPreview] = useState('');
    const [app, setApp] = useState('settings');
    const [left, setLeft] = useState('2');
    const [right, setRight] = useState('3');
    const [result, setResult] = useState('');
    const model = state.products.find(p => p.id === preview);
    const labels = { files: uiText("ui_6422db7e92b5"), calculator: uiText("ui_646aedc5115b"), browser: uiText("ui_b7f6f7b2b631") };
    return <PanelPages labels={['OS開発','製品・テスト']}><section className="card"><h2>{uiText("ui_0ce399ba446e")}</h2><p>{uiText("ui_4cd351bbeb75")}</p><div className="form-grid"><label>{uiText("ui_0992681a67a9")}<input value={name} onChange={e => setName(e.target.value)}/></label><label>{uiText("ui_7b193c28d422")}<input type="number" min={1} value={version} onChange={e => setVersion(Number(e.target.value))}/></label>{[[uiText("ui_0724cdf723da"), quality, setQuality], [uiText("ui_35eb9545133c"), compatibility, setCompatibility], [uiText("ui_449c69d77701"), support, setSupport]].map(([label, value, set]) => <label key={String(label)}>{String(label)}<input type="number" min={.1} max={1} step={.1} value={Number(value)} onChange={e => (set as (n: number) => void)(Number(e.target.value))}/></label>)}<label>{uiText("ui_139012c9114c")}<input type="number" min={1} value={price} onChange={e => setPrice(Number(e.target.value))}/></label></div><fieldset><legend>{uiText("ui_83bdc3a1fee7")}</legend>{(['files', 'calculator', 'browser'] as const).map(f => <label className="check-label" key={f}><input type="checkbox" checked={features.includes(f)} onChange={e => setFeatures(e.target.checked ? [...features, f] : features.filter(v => v !== f))}/>{labels[f]}</label>)}</fieldset><button className="primary" disabled={!state.research.completed.includes('os-compute-1')} onClick={() => send({ type: 'developOS', name, version, features, quality, compatibility, support, price })}>{uiText("ui_81fd13c2bb8d")}</button></section><section className="card os-products"><ProductCards state={state} send={send} kinds={['os']}/>{state.products.filter(p => p.kind === 'os' && p.remaining === 0).map(p => <button key={p.id} onClick={() => { setPreview(p.id); setApp('settings'); }}>{uiText("ui_e5298342477b")}</button>)}
 {model && <section className="card virtual-desktop"><div className="desktop-bar"><strong>{model.name} v{model.spec.version}{uiText("ui_0d0b5f4190b3")}</strong><button onClick={() => setPreview('')}>{uiText("ui_3da5c1855151")}</button></div><div className="button-row"><button onClick={() => setApp('settings')}>{uiText("ui_6329f21c4163")}</button>{osApps(model).map(a => <button key={a} onClick={() => setApp(a)}>{labels[a as keyof typeof labels]}</button>)}</div><div className="desktop-window">{app === 'settings' && <><h3>{uiText("ui_0e3cd2687c38")}</h3><p>{uiText("ui_ba59c3865e25")}{Number(model.spec.quality) * 100}{uiText("ui_150dbb989dbd")}{Number(model.spec.compatibility) * 100}</p></>}{app === 'files' && <><h3>{uiText("ui_c0eeea3fc450")}</h3>{state.products.map(p => <p key={p.id}>📄 {p.name}.product</p>)}</>}{app === 'browser' && <><h3>{uiText("ui_2d795a3bdc20")}</h3><p>{uiText("ui_0bc091440fe8")}{state.company.name}{uiText("ui_4a5255c57d0b")}{state.products.length}</p><p>{uiText("ui_478375841b68")}</p></>}{app === 'calculator' && <><h3>{uiText("ui_646aedc5115b")}</h3><div className="form-grid"><label>{uiText("ui_8610e291700e")}<input type="number" value={left} onChange={e => setLeft(e.target.value)}/></label><label>{uiText("ui_3f8c37f85605")}<input type="number" value={right} onChange={e => setRight(e.target.value)}/></label></div><button onClick={() => { const n = Number(left) + Number(right); setResult(Number.isFinite(n) ? String(n) : uiText("ui_b23deded80d5")); }}>{uiText("ui_4eb6c6f83e6a")}</button><output data-testid="calculator-result">{result}</output></>}</div></section>}</section></PanelPages>;
}
