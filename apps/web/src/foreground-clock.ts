export function createForegroundClock(now:()=>number,isVisible:()=>boolean){
 let elapsed=0,last=now(),nativePaused=false,active=isVisible();
 const tick=()=>{
  const current=now();
  const foreground=!nativePaused&&isVisible();
  if(active&&foreground)elapsed+=current-last;
  last=current;
  active=foreground;
  return elapsed;
 };
 return {
  elapsed:tick,
  pause(){if(nativePaused)return;tick();nativePaused=true;last=now();active=false;},
  resume(){if(!nativePaused){tick();return;}nativePaused=false;last=now();active=isVisible();},
  visibilityChanged(){tick();},
 };
}
