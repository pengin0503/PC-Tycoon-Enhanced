/**
 * The game runs as an app, not as a web page: no page zoom (pinch, double tap, Ctrl+wheel/keys), no text selection,
 * long-press menus or image dragging outside text fields. The in-game UI size setting replaces page zoom.
 */
const editable=(target:EventTarget|null)=>target instanceof HTMLElement&&(target.isContentEditable||target.matches('input:not([type=range]):not([type=checkbox]):not([type=radio]),textarea'));
const zoomKeys=new Set(['+','-','=','0',';']);
export function installAppGestures(doc:Document=document){
 doc.addEventListener('contextmenu',e=>{if(!editable(e.target))e.preventDefault();});
 doc.addEventListener('selectstart',e=>{if(!editable(e.target))e.preventDefault();});
 doc.addEventListener('dragstart',e=>{if(!editable(e.target))e.preventDefault();});
 doc.addEventListener('wheel',e=>{if(e.ctrlKey)e.preventDefault();},{passive:false});
 doc.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&zoomKeys.has(e.key))e.preventDefault();});
 doc.addEventListener('touchmove',e=>{if(e.touches.length>1)e.preventDefault();},{passive:false});
 // Safari-family pinch gestures.
 for(const name of ['gesturestart','gesturechange','gestureend'])doc.addEventListener(name,e=>e.preventDefault());
}
