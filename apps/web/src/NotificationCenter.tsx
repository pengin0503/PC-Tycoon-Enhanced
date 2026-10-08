import {useState} from 'react';
import type {GameState,GameCommand} from '../../../packages/sim/src/index';
import {eventLabel} from './i18n';
import {useBackHandler} from './app-gestures';
type Category='all'|'release'|'research'|'finance'|'event';
const filters:[Category,string][]=[['all','すべて'],['release','製品発売'],['research','研究'],['finance','経営'],['event','イベント']];
export function NotificationCenter({state,send,close}:{state:GameState,send:(cmd:GameCommand)=>void,close:()=>void}){
 useBackHandler(()=>{close();return true;},true,90);
 const [category,setCategory]=useState<Category>('all');
 const unread=state.notifications.filter(n=>n.id>state.notificationReadId).length;
 const items=state.notifications.filter(n=>category==='all'||n.category===category).slice().reverse();
 return <aside role="region" aria-label="通知センター" className="notification-center">
  <header className="notification-header"><h2>通知センター（未読 {unread}）</h2><button aria-label="通知センターを閉じる" onClick={close}>×</button></header>
  <div className="notification-filters" aria-label="通知の種類">{filters.map(([id,title])=><button key={id} aria-pressed={category===id} onClick={()=>setCategory(id)}>{title}</button>)}</div>
  <button disabled={!unread} onClick={()=>send({type:'markNotificationsRead',id:state.notificationSeq})}>すべて既読</button>
  <ol className="notification-list">{items.map(n=><li key={n.id}>
   <span>Day {n.day} · {eventLabel(n.kind)} {n.id>state.notificationReadId&&<strong className="unread-tag">未読</strong>}</span>
   <p>{n.detail}</p>
  </li>)}</ol>
  {items.length===0&&<p>表示する通知はありません。</p>}
 </aside>;
}

