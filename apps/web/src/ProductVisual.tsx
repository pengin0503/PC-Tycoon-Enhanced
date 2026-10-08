import { t as uiText } from './i18n';
import type { Product } from '../../../packages/sim/src/types';
export function ProductVisual({ product: p }: {
    product: Product;
}) {
    const color = p.spec.appearance === 'teal' ? '#60d4bd' : p.spec.appearance === 'silver' ? '#b6c8d7' : '#647e98';
    return <svg viewBox="0 0 240 130" role="img" aria-label={uiText("ui_fbd2e0f752d5")} className="product-visual"><title>{uiText("ui_fbd2e0f752d5")}</title><rect width="240" height="130" rx="8" fill="#1b2e46"/>{p.kind === 'monitor' || p.kind === 'laptop' ? <><rect x="53" y="16" width="134" height="82" rx="5" fill={color}/><rect x="60" y="23" width="120" height="68" fill="#12223a"/><path d="M60 80 L110 42 L137 60 L180 32 V91 H60Z" fill="#2e7975"/>{p.kind === 'laptop' ? <path d="M53 98 L28 115 H212 L187 98Z" fill={color}/> : <><rect x="111" y="98" width="18" height="16" fill={color}/><rect x="90" y="113" width="60" height="5" fill={color}/></>}</> : p.kind === 'os' ? <><rect x="62" y="22" width="116" height="87" rx="10" fill="#267672"/><rect x="80" y="38" width="32" height="32" rx="6" fill="#89e6d1"/><path d="M121 46 H158 M121 58 H151 M82 82 H156 M82 93 H143" stroke="#caeee6" strokeWidth="5"/></> : <><rect x="84" y="15" width="72" height="100" rx="7" fill={color}/><rect x="94" y="25" width="52" height="9" rx="2" fill="#1b3047"/><circle cx="120" cy="65" r="22" fill="#1f4857"/><circle cx="120" cy="65" r="15" fill="none" stroke="#78e2c8" strokeWidth="4"/><rect x="96" y="96" width="32" height="3" fill="#a5d0d1"/></>}</svg>;
}
