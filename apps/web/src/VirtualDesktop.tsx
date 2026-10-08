import {useEffect,useState} from 'react';
import {osFeatureLabels,lockScreenLabels,type OSFeature} from '../../../packages/content/src/os';
import {benchmarkPresets} from '../../../packages/content/src/market';
import {osApps} from '../../../packages/sim/src/devices';
import {benchmarkDevice} from '../../../packages/sim/src/benchmark';
import {osRequirements} from '../../../packages/sim/src/os';
import type {GameState} from '../../../packages/sim/src/index';
import type {Product} from '../../../packages/sim/src/types';
import {gameDate} from './ui';

/** Fictional OS preview: installer → lock screen → desktop with the OS's own apps. Not an emulator. */
export function VirtualDesktop({state,os,close}:{state:GameState,os:Product,close:()=>void}){
 const [stage,setStage]=useState<'install'|'lock'|'desktop'>('install');
 const [progress,setProgress]=useState(0);
 const [app,setApp]=useState<string>('settings');
 const [left,setLeft]=useState('2');const [right,setRight]=useState('3');const [result,setResult]=useState('');
 const pcs=state.products.filter(p=>(p.kind==='pc'||p.kind==='laptop')&&p.remaining===0);
 const [pcId,setPC]=useState(pcs.find(p=>p.spec.osId===os.id)?.id??pcs[0]?.id??'');
 useEffect(()=>{if(stage!=='install')return;const id=setInterval(()=>setProgress(p=>Math.min(100,p+10)),180);return()=>clearInterval(id);},[stage]);
 useEffect(()=>{if(stage==='install'&&progress>=100)setStage('lock');},[stage,progress]);
 const theme=String(os.spec.theme??'teal'),wallpaper=String(os.spec.lockScreen??'aurora');
 const date=gameDate(state.year,state.day);
 const apps=['settings',...osApps(os)];
 const label=(a:string)=>a==='settings'?'設定':osFeatureLabels[a as OSFeature]??a;
 const req=osRequirements(os);
 const pc=pcs.find(p=>p.id===pcId);
 const bench=pc?benchmarkDevice(state,{...pc,spec:{...pc.spec,osId:os.id}}):null;
 return <section className={`virtual-desktop theme-${theme}`} aria-label={`${os.name} 仮想デスクトップ`}>
  <div className="desktop-bar"><strong>{os.name} v{String(os.spec.version)}（ゲーム内プレビュー）</strong><button onClick={close}>プレビューを閉じる</button></div>
  {stage==='install'&&<div className="os-installer"><h3>{os.name} をインストールしています</h3><progress max={100} value={progress} aria-label="インストール進行"/><p>{progress}%</p><button onClick={()=>setStage('lock')}>インストールをスキップ</button></div>}
  {stage==='lock'&&<div className={`lock-screen wallpaper ${wallpaper}`}><p className="clock">{String(date.month).padStart(2,'0')}/{String(date.date).padStart(2,'0')}</p><p>{lockScreenLabels[wallpaper as keyof typeof lockScreenLabels]??wallpaper}</p><button className="primary" onClick={()=>setStage('desktop')}>ロック解除</button></div>}
  {stage==='desktop'&&<div className={`desktop wallpaper ${wallpaper}`}>
   <div className="desktop-window" role="region" aria-label={label(app)}>
    <h3>{label(app)}</h3>
    {app==='settings'&&<dl><dt>品質</dt><dd>{Math.round(Number(os.spec.quality)*100)}</dd><dt>互換性</dt><dd>{Math.round(Number(os.spec.compatibility)*100)}</dd><dt>動作要件</dt><dd>CPU {req.cpu} / RAM {req.ram}GB / {req.storage}GB</dd></dl>}
    {app==='files'&&<ul className="file-list">{state.products.slice(0,12).map(p=><li key={p.id}>📄 {p.name}.product</li>)}</ul>}
    {app==='browser'&&<><p>{state.company.name} 公式サイト — 製品 {state.products.length} 件</p><p>オフラインのゲーム内ページです。外部サイトには接続しません。</p></>}
    {app==='calculator'&&<><div className="form-grid"><label>左の数<input type="number" value={left} onChange={e=>setLeft(e.target.value)}/></label><label>右の数<input type="number" value={right} onChange={e=>setRight(e.target.value)}/></label></div><button onClick={()=>{const n=Number(left)+Number(right);setResult(Number.isFinite(n)?String(n):'計算できません');}}>計算する</button><output data-testid="calculator-result">{result}</output></>}
    {app==='security'&&<p>リアルタイム保護：有効。ハッカー攻撃の被害を軽減します。</p>}
    {app==='media'&&<p>♪ 再生中：オフィスBGM（ゲーム内）</p>}
    {app==='store'&&<p>アプリストア：{apps.length} 個のアプリを配信中</p>}
    {app==='games'&&<>{pcs.length?<label>テストするPC<select value={pcId} onChange={e=>setPC(e.target.value)}>{pcs.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>:<p>完成PCまたはノートPCを設計するとゲームテストができます。</p>}
     {bench&&<table className="bench-table"><caption>ゲームテスト（架空タイトル・ゲーム内単位）{bench.osPenalty&&' — 動作要件不足'}</caption><thead><tr><th>タイトル</th>{Object.values(benchmarkPresets).map(p=><th key={p.label}>{p.label}</th>)}</tr></thead>
      <tbody>{bench.games.map(g=><tr key={g.id}><td>{g.name}</td>{Object.keys(benchmarkPresets).map(k=><td key={k}>{g.fps[k as keyof typeof g.fps]} fps</td>)}</tr>)}</tbody></table>}</>}
   </div>
   <nav className="taskbar" aria-label="タスクバー">{apps.map(a=><button key={a} aria-pressed={app===a} onClick={()=>setApp(a)}>{label(a)}</button>)}</nav>
  </div>}
 </section>;
}
