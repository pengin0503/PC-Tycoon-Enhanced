import {PanelPages} from './PanelPages';
import { t as uiText } from './i18n';
import { useState } from 'react';
import { aiGPUs } from '../../../packages/content/src/ai';
import { estimateLLM, estimateInference, type LLMDesign } from '../../../packages/sim/src/ai-math';
import { aiMarketQuote, aiEffects } from '../../../packages/sim/src/ai';
import type { GameState, GameCommand } from '../../../packages/sim/src/index';
import { yen } from './i18n';
const initial: LLMDesign = { architecture: 'dense', total: 1e9, active: 1e9, layers: 24, hidden: 2048, attention: 'standard', context: 4096, tokens: 1e9, quality: .8, diversity: .8 };
export function AIPanel({ state, send }: {
    state: GameState;
    send: (c: GameCommand) => void;
}) {
    const [gpuId, setGPU] = useState('v-ai-workstation');
    const [serverId, setServer] = useState('vendor');
    const [gpus, setGPUs] = useState(1);
    const [network, setNetwork] = useState(.8);
    const [cooling, setCooling] = useState(.9);
    const [design, setDesign] = useState(initial);
    const [name, setName] = useState('Polar One');
    const [budget, setBudget] = useState(10000);
    const [clusterId, setCluster] = useState('');
    const selected = clusterId || state.clusters[0]?.id || '';
    const cluster = state.clusters.find(c => c.id === selected);
    const [bits, setBits] = useState<4 | 8 | 16>(16);
    const [context, setContext] = useState(4096);
    const [batch, setBatch] = useState(1);
    const [mode, setMode] = useState<'api' | 'subscription' | 'open'>('api');
    const [apiPrice, setAPIPrice] = useState(1000);
    const [subscriptionPrice, setSubscription] = useState(500);
    let summary = null, warning = '';
    try {
        if (cluster)
            summary = { train: estimateLLM(design, cluster, aiEffects(state)), inference: estimateInference(design, cluster, bits, context, batch, aiEffects(state)) };
    }
    catch (e) {
        warning = e instanceof Error ? e.message : uiText("ui_a567d6987591");
    }
    const quote = aiMarketQuote(state);
    const fields: [
        keyof LLMDesign,
        string,
        number,
        number,
        number,
        number
    ][] = [['total', uiText("ui_7932d8173a37"), .001, 1000, .1, 1e9], ['active', uiText("ui_ead94c90a55f"), .001, 1000, .1, 1e9], ['layers', uiText("ui_c886643841d7"), 1, 256, 1, 1], ['hidden', 'Hidden size', 128, 32768, 128, 1], ['context', uiText("ui_8bd622dcf595"), 128, 1048576, 128, 1], ['tokens', uiText("ui_c3b448bd3682"), .001, 10000, .1, 1e9], ['quality', uiText("ui_a41744faeca4"), .1, 1, .1, 1], ['diversity', uiText("ui_72766d79e538"), .1, 1, .1, 1]];
    return <PanelPages labels={['クラスタ','モデル開発','サービス設定','モデル一覧']}><section className="card"><h2>{uiText("ui_18c417f157e0")}</h2><p>{uiText("ui_efc59fcfbf44")}</p><div className="form-grid"><label>{uiText("ui_6638f0cc9076")}<select value={gpuId} onChange={e => setGPU(e.target.value)}>{aiGPUs.map(g => <option key={g.id} value={g.id}>{g.label} · {g.vramBytes / 1e9}GB · {yen(g.cost)}</option>)}{state.products.filter(p => p.kind === 'gpu' && p.launched).map(p => <option key={p.id} value={p.id}>{uiText("ui_28a99d3f5844")}{p.name}{uiText("ui_8409c9c1e7b0")}{p.inventory}</option>)}</select></label><label>{uiText("ui_ad2a4879c012")}<select value={serverId} onChange={e => setServer(e.target.value)}><option value="vendor">{uiText("ui_7e9985d27ece")}</option>{state.products.filter(p => p.kind === 'pc' && p.spec.purpose === 'server' && p.launched).map(p => <option key={p.id} value={p.id}>{p.name}{uiText("ui_8409c9c1e7b0")}{p.inventory}</option>)}</select></label><label>{uiText("ui_33e40ac804ab")}<input type="number" min={1} max={256} value={gpus} onChange={e => setGPUs(Number(e.target.value))}/></label><label>{uiText("ui_660c30e7ebaf")}<input type="number" min={.1} max={1} step={.1} value={network} onChange={e => setNetwork(Number(e.target.value))}/></label><label>{uiText("ui_a0dd58da3526")}<input type="number" min={.1} max={1} step={.1} value={cooling} onChange={e => setCooling(Number(e.target.value))}/></label></div><button className="primary" disabled={!state.research.completed.includes('ai-compute-1')} onClick={() => send({ type: 'buyCluster', gpuId, serverId, gpus, network, cooling })}>{uiText("ui_e616446a0d3f")}</button><div className="grid-list" style={{ marginTop: 16 }}>{state.clusters.map(c => <article key={c.id}><h3>{c.id} · {c.gpus} GPU</h3><p>VRAM {c.vramBytes / 1e9}{uiText("ui_d3bc4cf9e38f")}{c.powerWatts}{uiText("ui_9c866eb15c28")}{yen(c.purchaseCost)}</p></article>)}</div></section>
 <section className="card"><h2>{uiText("ui_b8b7ffa34203")}</h2><div className="form-grid"><label>{uiText("ui_310a822d83da")}<input value={name} onChange={e => setName(e.target.value)}/></label><label>{uiText("ui_a67e9f5d800b")}<select value={design.architecture} onChange={e => setDesign({ ...design, architecture: e.target.value as LLMDesign['architecture'] })}><option value="dense">Dense</option><option value="moe">MoE</option></select></label><label>Attention<select value={design.attention} onChange={e => setDesign({ ...design, attention: e.target.value as LLMDesign['attention'] })}><option value="standard">Standard</option><option value="grouped">Grouped KV</option></select></label>{fields.map(([key, label, min, max, step, scale]) => <label key={key}>{label}<input type="number" min={min} max={max} step={step} value={Number(design[key]) / scale} onChange={e => setDesign({ ...design, [key]: Number(e.target.value) * scale })}/></label>)}<label>{uiText("ui_dead34f3e392")}<select value={selected} onChange={e => setCluster(e.target.value)}>{state.clusters.map(c => <option key={c.id}>{c.id}</option>)}</select></label><label>{uiText("ui_e3c8327ea190")}<input type="number" min={1} value={budget} onChange={e => setBudget(Number(e.target.value))}/></label></div>{warning && <p className="error">{warning.slice(0, 200)}</p>}{summary && <div className="metrics" style={{ marginTop: 20 }}><article className="metric"><span>{uiText("ui_eb7bbd2fa37f")}</span><strong>{summary.train.trainingFlops.toExponential(2)}</strong></article><article className="metric"><span>{uiText("ui_b79c171cc3fc")}</span><strong>{(summary.train.seconds / 86400).toFixed(1)}{uiText("ui_15917f3b3261")}</strong></article><article className="metric"><span>{uiText("ui_1d1e2b693585")}</span><strong>{yen(summary.train.cost)}</strong></article><article className="metric"><span>{uiText("ui_88494e3f2ac8")}</span><strong>{(summary.train.trainingMemoryBytes / 1e9).toFixed(1)}GB</strong></article></div>}<button className="primary" disabled={!cluster} onClick={() => send({ type: 'trainModel', name, design, clusterId: selected, budget })}>{uiText("ui_5da06109b46b")}</button></section>
 <section className="card"><h2>{uiText("ui_8b5d4c28b7b9")}</h2><p>{uiText("ui_a7f3e9a46df8")}{yen(quote.price)}{uiText("ui_3d80fed0fed2")}</p><div className="form-grid"><label>{uiText("ui_8f4241ca49ae")}<select value={bits} onChange={e => setBits(Number(e.target.value) as typeof bits)}><option value={16}>16</option><option value={8}>8</option><option value={4}>4</option></select></label><label>{uiText("ui_82d53b1db2c0")}<input type="number" min={128} value={context} onChange={e => setContext(Number(e.target.value))}/></label><label>{uiText("ui_411c09edbc91")}<input type="number" min={1} max={256} value={batch} onChange={e => setBatch(Number(e.target.value))}/></label><label>{uiText("ui_019c4d960b4d")}<select value={mode} onChange={e => setMode(e.target.value as typeof mode)}><option value="api">{uiText("ui_d92c3494c0c2")}</option><option value="subscription">{uiText("ui_34645d2673ad")}</option><option value="open">{uiText("ui_de62655ecc28")}</option></select></label><label>{uiText("ui_a96cfb133a5d")}<input type="number" min={1} value={apiPrice} onChange={e => setAPIPrice(Number(e.target.value))}/></label><label>{uiText("ui_57bd95b80de3")}<input type="number" min={1} value={subscriptionPrice} onChange={e => setSubscription(Number(e.target.value))}/></label></div>{summary && <p>{uiText("ui_3aee3bcd87b5")}{(summary.inference.memoryBytes / 1e9).toFixed(2)}{uiText("ui_8af199f48ed5")}{(summary.inference.weightBytes / 1e9).toFixed(2)} + KV {(summary.inference.kvBytes / 1e9).toFixed(2)}{uiText("ui_dce3b20bb81c")}{summary.inference.tokensPerSecond.toFixed(0)}{uiText("ui_dddb77d1cd8b")}</p>}</section>
 <section className="card"><h2>{uiText("ui_03db705feda8")}</h2><div className="grid-list">{state.models.map(m => <article className="card" key={m.id}><h3>{m.name}</h3><span className="pill" data-testid={`model-status-${m.id}`}>{m.status === 'ready' ? uiText("ui_88bf5a09f213") : m.status === 'failed' ? uiText("ui_1284623b3699") : uiText("ui_61c7720cc8b9")}</span><p>{uiText("ui_d5b5ab33ebb3")}{yen(m.trainingCost)} · {m.design.architecture.toUpperCase()} · {m.design.total / 1e9}B</p>{m.status === 'training' && <progress max={1} value={1 - Math.max(m.remainingSeconds / m.initialSeconds, m.preparationRemaining / 7)}/>}<dl>{Object.entries(m.scores).map(([key, value]) => <div key={key}><dt>{{ math: uiText("ui_b79624b8aea0"), coding: uiText("ui_31c02c9bf671"), knowledge: uiText("ui_7f37e63cc1d3"), reasoning: uiText("ui_9ddcc220987f"), multilingual: uiText("ui_598eab3845af") }[key]}</dt><dd>{value}</dd></div>)}</dl>{m.status === 'ready' && <button onClick={() => send({ type: 'deployModel', id: m.id, clusterId: selected, bits, context, batch, mode, apiPrice, subscriptionPrice })}>{uiText("ui_ea9f67958d9d")}</button>}{m.service && <><p>{uiText("ui_4ce9348255b7")}{m.service.tokens.toLocaleString()}{uiText("ui_937974aa64f0")}{m.service.users}</p><p>{uiText("ui_af3be7e8f881")}<b data-testid={`ai-revenue-${m.id}`}>{yen(m.service.revenue)}</b>{uiText("ui_f2f49263d15c")}{yen(m.service.cost)}</p><p>{uiText("ui_4d0f3934823c")}{yen(m.service.revenue - m.service.cost - m.trainingCost)}</p><button disabled={!m.service.enabled} onClick={() => send({ type: 'retireModel', id: m.id })}>{uiText("ui_1781d758bc86")}</button></>}</article>)}</div></section></PanelPages>;
}
