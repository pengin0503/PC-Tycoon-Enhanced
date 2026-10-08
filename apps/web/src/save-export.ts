import {Capacitor,registerPlugin} from '@capacitor/core';
import {exportSave} from '../../../packages/save/src/index';
import type {GameState} from '../../../packages/sim/src/types';
export type ExportPayload={filename:string,json:string};
export interface SaveTransport{write(payload:ExportPayload):Promise<void>}
const documentPlugin=registerPlugin<SaveTransport>('SaveDocument');
export async function writeGameExport(game:GameState,transport:SaveTransport){
 const json=exportSave(game);const filename=`pc-tycoon-${game.id.replace(/[^a-zA-Z0-9_-]/g,'_').slice(0,80)}.json`;
 await transport.write({filename,json});
}
export async function downloadGame(game:GameState){
 const browser:SaveTransport={async write({filename,json}){
  const url=URL.createObjectURL(new Blob([json],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;link.download=filename;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }};
 await writeGameExport(game,Capacitor.isNativePlatform()?documentPlugin:browser);
}
