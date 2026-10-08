import { t as uiText } from './i18n';
import { useState } from 'react';
import type { Product } from '../../../packages/sim/src/types';
import type { GameCommand } from '../../../packages/sim/src/index';
export function PriceEditor({ product: p, send }: {
    product: Product;
    send: (c: GameCommand) => void;
}) {
    const [draft, setDraft] = useState(String(p.price));
    return <div><label>{uiText("ui_7fbd0b3bdbca")}<input aria-label={`${p.name} 価格`} type="number" min={1} step={1} value={draft} onChange={e => setDraft(e.target.value)}/></label><button disabled={!draft} onClick={() => send({ type: 'price', id: p.id, price: Number(draft) })}>{uiText("ui_4fd144438643")}</button></div>;
}
export function ProductionEditor({ product: p, send }: {
    product: Product;
    send: (c: GameCommand) => void;
}) {
    const [target, setTarget] = useState(String(p.target || 100));
    return <div><label>{uiText("ui_bf2275b32012")}<input aria-label={`${p.name} 在庫目標`} type="number" min={0} max={100000} step={1} value={target} onChange={e => setTarget(e.target.value)}/></label><div className="button-row"><button disabled={!target} onClick={() => send({ type: 'line', id: p.id, target: Number(target) })}>{uiText("ui_cc00dce2515a")}</button><button onClick={() => send({ type: 'line', id: p.id, target: p.line ? 0 : Number(target) })}>{p.line ? uiText("ui_3e9e944ff26b") : uiText("ui_f59c0c5a321e")}</button></div></div>;
}
