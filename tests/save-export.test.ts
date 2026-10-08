import {describe,it,expect,vi} from 'vitest';
import {createGame} from '../packages/sim/src/index';
import {exportSave,importSave} from '../packages/save/src/index';
import {writeGameExport} from '../apps/web/src/save-export';
const game=(id='g')=>createGame({id,name:'保存試験',year:2026,difficulty:'normal',seed:42});
describe('native JSON export transport',()=>{
 it('uses the same canonical JSON and safe filename as the browser',async()=>{
  const state=game('game-1');const transport={write:vi.fn(async(_payload:{filename:string,json:string})=>{})};
  await writeGameExport(state,transport);expect(transport.write).toHaveBeenCalledOnce();
  const payload=transport.write.mock.calls[0][0];expect(payload).toEqual({filename:'pc-tycoon-game-1.json',json:exportSave(state)});expect(importSave(payload.json)).toEqual(state);
 });
 it('awaits the document write rather than reporting success while pending',async()=>{
  let finish!:()=>void;const pending=new Promise<void>(resolve=>{finish=resolve});let done=false;
  const result=writeGameExport(game(),{write:()=>pending}).then(()=>{done=true});
  await Promise.resolve();expect(done).toBe(false);finish();await result;expect(done).toBe(true);
 });
 it('propagates cancellation or write failure with the game unchanged',async()=>{
  const state=game(),copy=structuredClone(state);
  await expect(writeGameExport(state,{write:async()=>{throw new Error('document write failed')}})).rejects.toThrow('document write failed');expect(state).toEqual(copy);
 });
 it('rejects invalid snapshots before any document creation and sanitizes imported ids',async()=>{
  const state=game('../../../bad');const transport={write:vi.fn(async(_payload:{filename:string,json:string})=>{})};
  await writeGameExport(state,transport);expect(transport.write.mock.calls[0][0].filename).toBe('pc-tycoon-_________bad.json');
  state.company.cash=-1;transport.write.mockClear();await expect(writeGameExport(state,transport)).rejects.toThrow();expect(transport.write).not.toHaveBeenCalled();
 });
});
