export function createForegroundClock(now:()=>number,isVisible:()=>boolean){
 let elapsed=0,last=now(),nativePaused=false,active=isVisible();
 const tick=()=>{
  const current=now();
  if(active)elapsed+=current-last;
  last=current;
  active=!nativePaused&&isVisible();
  return elapsed;
 };
 return {
  elapsed:tick,
  pause(){if(nativePaused)return;tick();nativePaused=true;last=now();active=false;},
  resume(){if(!nativePaused){tick();return;}nativePaused=false;last=now();active=isVisible();},
  visibilityChanged(){tick();last=now();active=!nativePaused&&isVisible();},
 };
}
