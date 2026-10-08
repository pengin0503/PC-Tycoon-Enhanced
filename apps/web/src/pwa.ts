import {useSyncExternalStore} from 'react';
import {Capacitor} from '@capacitor/core';
type OfflineStatus=''|'offlinePreparing'|'offlineReady'|'offlineUpdate'|'offlineError'|'offlineNative';
let status:OfflineStatus='';const listeners=new Set<()=>void>();
function notify(next:OfflineStatus){status=next;listeners.forEach(listener=>listener());}
export function useOfflineStatus(){return useSyncExternalStore(listener=>{listeners.add(listener);return()=>listeners.delete(listener)},()=>status);}
export async function registerPWA(){
 if(Capacitor.isNativePlatform()){notify('offlineNative');return;}
 if(!import.meta.env.PROD)return;
 if(!('serviceWorker'in navigator)){notify('offlineError');return;}
 notify('offlinePreparing');
 try{
  const registration=await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`);
  const track=()=>{const worker=registration.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed')notify(navigator.serviceWorker.controller?'offlineUpdate':'offlineReady');if(worker.state==='redundant'&&!registration.active)notify('offlineError');});};
  registration.addEventListener('updatefound',track);track();
  await navigator.serviceWorker.ready;notify(registration.waiting?'offlineUpdate':'offlineReady');
 }catch{notify('offlineError');}
}
