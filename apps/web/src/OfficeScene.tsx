import { t as uiText } from './i18n';
import type { GameState } from '../../../packages/sim/src/index';
export function OfficeScene({ state }: {
    state: GameState;
}) {
    const floors = Math.ceil(state.officeLevel / 2);
    const height = 40 + floors * 22;
    return <svg role="img" aria-label={uiText("ui_140914e041e5")} viewBox="0 0 520 220" className="office-scene"><title>{uiText("ui_140914e041e5")}</title><rect width="520" height="220" fill="#15263b"/><circle cx="440" cy="45" r="24" fill="#28455d"/><path d="M0 190 Q170 180 260 195 Q410 170 520 188 V220 H0Z" fill="#1c4041"/><rect x="155" y={190 - height} width="240" height={height} rx="5" fill="#42576e"/><rect x="145" y={180 - height} width="260" height="12" rx="4" fill="#69dec5"/>{Array.from({ length: floors }, (_, floor) => Array.from({ length: 8 }, (_, col) => <rect key={`${floor}-${col}`} x={169 + col * 27} y={190 - height + 12 + floor * 22} width="16" height="12" rx="2" fill={floor * 8 + col < state.staff.length ? '#ffe2a0' : '#96bdc8'}/>))}<rect x="263" y="161" width="28" height="29" fill="#172f43"/><path d="M20 190 V145 L55 130 V145 L90 130 V190Z" fill="#456e7b"/><rect x="29" y="117" width="10" height="35" fill="#6d8a92"/><rect x="68" y="108" width="10" height="38" fill="#6d8a92"/><text x="23" y="177" fill="#b9f3da" fontSize="12">F{state.factoryLevel}</text><text x="169" y={174 - height} fill="#cdf4e9" fontSize="11">OFFICE · L{state.officeLevel}</text>{state.clusters.length > 0 && <><rect x="424" y="129" width="58" height="61" rx="3" fill="#203449"/>{Array.from({ length: Math.min(6, state.clusters.length) }, (_, i) => <rect key={i} x="433" y={138 + i * 7} width="40" height="3" fill="#84f1ce"/>)}</>}</svg>;
}
