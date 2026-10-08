import {offices,hrBalance,staffTraitLabels,staffTraitDescriptions,managementBalance} from '../../../packages/content/src/management';
import {salaryFor} from '../../../packages/sim/src/business';
import type {GameState,GameCommand} from '../../../packages/sim/src/index';
import {PanelPages} from './PanelPages';
import {Meter,Chip,Empty} from './ui';
import {yen} from './i18n';

const roleLabels={research:'研究',engineering:'開発',marketing:'マーケティング',ai:'AI'} as const;
const roleTone={research:'rp',engineering:'accent',marketing:'warn',ai:'good'} as const;
function Person({role,skill,trait}:{role:keyof typeof roleLabels,skill:number,trait?:keyof typeof staffTraitLabels}){
 return <div className="person"><span className={`avatar ${role}`} aria-hidden="true"/><div><strong>{roleLabels[role]}担当</strong>{trait&&<Chip tone="gold">{staffTraitLabels[trait]}</Chip>}
  <div className="skill"><Meter value={skill} tone={roleTone[role]} label={`能力 ${skill}`}/><b>{skill}</b></div>{trait&&<small>{staffTraitDescriptions[trait]}</small>}</div></div>;
}
export function StaffScreen({state,send}:{state:GameState,send:(c:GameCommand)=>void}){
 const capacity=offices[state.officeLevel-1].staffCapacity,full=state.staff.length>=capacity;
 const payroll=state.staff.reduce((n,e)=>n+e.salary,0);
 return <section className="screen staff-screen">
  <header className="screen-title"><h2>人事 <small>社員 <span data-testid="staff-count">{state.staff.length}</span> / {capacity}名 · 給与 {yen(payroll)}/月</small></h2></header>
  <PanelPages labels={['候補者','社員','人材探し']}>
   <div>{full&&<p className="warning">オフィスの社員枠が上限です。アップグレードで枠を増やせます。</p>}
    {state.candidates.length?<div className="people-grid">{state.candidates.map(k=><article key={k.id} className="person-card"><Person role={k.role} skill={k.skill} trait={k.trait}/>
     <dl><dt>採用費</dt><dd>{yen(k.skill*managementBalance.recruitPerSkill)}</dd><dt>給与</dt><dd>{yen(salaryFor(k.skill,k.trait))}/月</dd></dl>
     <button className="primary" disabled={full||state.company.cash<k.skill*managementBalance.recruitPerSkill} onClick={()=>send({type:'hireCandidate',id:k.id})}>採用する</button></article>)}</div>
     :<Empty>候補者はいません。毎月新しい候補者が集まり、人材探しで今すぐ探すこともできます。</Empty>}</div>
   <div>{state.staff.length?<div className="people-grid">{state.staff.map(e=><article key={e.id} className="person-card"><Person role={e.role} skill={e.skill} trait={e.trait}/>
    <dl><dt>給与</dt><dd>{yen(e.salary)}/月</dd><dt>退職金</dt><dd>{yen(e.salary*hrBalance.severanceMonths)}</dd></dl>
    <div className="button-row"><button disabled={e.skill>=100} onClick={()=>send({type:'train',id:e.id})}>育成する（{yen(managementBalance.trainingCost)}）</button><button className="danger" onClick={()=>send({type:'fire',id:e.id})}>解雇</button></div></article>)}</div>
    :<Empty>社員はまだいません。創業者が一人で研究と開発を進めています。</Empty>}</div>
   <div className="search-grid">{(['standard','premium'] as const).map(tier=>{const cfg=hrBalance.searches[tier];return <article key={tier} className="card">
    <h3>{tier==='standard'?'人材紹介会社':'ヘッドハンティング'}</h3><p>能力 {cfg.minSkill}～{Math.min(100,cfg.minSkill+cfg.skillRange)} の候補者 {hrBalance.candidateCount}名。特殊スキル保有率 {Math.round(cfg.traitChance*100)}%。現在の候補者は入れ替わります。</p>
    <button className="primary" disabled={state.company.cash<cfg.cost} onClick={()=>send({type:'searchCandidates',tier})}>{yen(cfg.cost)}で探す</button></article>;})}</div>
  </PanelPages>
 </section>;
}
