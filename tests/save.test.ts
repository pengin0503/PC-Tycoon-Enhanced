import {it,expect} from 'vitest';
import {indexedDB} from 'fake-indexeddb';
import {createGame,command} from '../packages/sim/src/index';
import * as raw from '../packages/save/src/index';
import * as repoApi from '../packages/save/src/repository';
const api=raw as any; const repository=repoApi as any;
const s=createGame({id:'slot',name:'テスト',year:2026,difficulty:'normal',seed:42});
it('exports validated snapshots and resumes exactly',()=>{
 expect(api.exportSave).toBeTypeOf('function');
 const restored=api.importSave(api.exportSave(s));
 expect(restored).toEqual(s); expect(command(restored,{type:'advance',days:90})).toEqual(command(s,{type:'advance',days:90}));
});
it('migrates v0 cash while preserving seed and identity',()=>{
 const old:any=JSON.parse(JSON.stringify(s));old.version=0;old.cash=old.company.cash;delete old.company.cash;
 expect(api.importSave(JSON.stringify(old))).toEqual(s);
});
it('rejects bad, oversized, future or structurally invalid saves',()=>{
 for(const data of ['{','null','x'.repeat(5*1024*1024+1),JSON.stringify({...s,version:99}),JSON.stringify({...s,company:{...s.company,cash:-1}}),JSON.stringify({...s,seed:null})]) expect(()=>api.importSave(data)).toThrow();
 expect(()=>api.exportSave({...s,company:{...s.company,cash:Infinity}})).toThrow();
});
it('uses real IndexedDB atomic snapshots, latest slot and deletion',async()=>{
 expect(repository.SaveRepository).toBeTypeOf('function');
 const repo=new repository.SaveRepository(indexedDB,'test-roundtrip');
 await repo.save(s);expect(await repo.load('slot')).toEqual(s);
 await repo.save({...s,id:'second',day:7});expect((await repo.latest()).id).toBe('second');
 expect(await repo.list()).toHaveLength(2);await repo.delete('second');expect(await repo.load('second')).toBeNull();
 expect((await repo.latest()).id).toBe('slot');repo.close();
});
it('reports unavailable storage instead of claiming success',async()=>{
 expect(repository.SaveRepository).toBeTypeOf('function');
 const repo=new repository.SaveRepository(undefined,'unavailable');
 await expect(repo.save(s)).rejects.toThrow();
});
it('rejects write after close and retains persisted state',async()=>{
 const repo=new repository.SaveRepository(indexedDB,'test-close');await repo.save(s);repo.close();
 await expect(repo.save({...s,day:9})).rejects.toThrow();
 const reopened=new repository.SaveRepository(indexedDB,'test-close');expect((await reopened.load('slot')).day).toBe(0);reopened.close();
});
it('lists valid save rows when other rows are corrupt and preserves the corrupt rows',async()=>{
 const name='test-corrupt-list';const repo=new repository.SaveRepository(indexedDB,name);
 await repo.save(s);await repo.save({...s,id:'second',day:7,company:{...s.company,name:'二番目'}});
 const db=await new Promise<IDBDatabase>((resolve,reject)=>{
  const req=indexedDB.open(name,1);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
 });
 await new Promise<void>((resolve,reject)=>{
  const tx=db.transaction('saves','readwrite');const store=tx.objectStore('saves');
  store.put({id:'broken-json',json:'{',order:10});
  store.put({id:'broken-state',json:JSON.stringify({...s,company:{...s.company,cash:-1}}),order:11});
  tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
 });
 db.close();
 expect(await repo.list()).toEqual([
  {id:'second',day:7,name:'二番目'},
  {id:'slot',day:0,name:'テスト'},
 ]);
 expect(repo.warnings).toHaveLength(2);
 expect(await repo.load('second')).toMatchObject({id:'second',day:7});
 const reopened=await new Promise<IDBDatabase>((resolve,reject)=>{
  const req=indexedDB.open(name,1);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
 });
 const rows=await new Promise<any[]>((resolve,reject)=>{
  const req=reopened.transaction('saves','readonly').objectStore('saves').getAll();
  req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
 });
 expect(rows.map((row:any)=>row.id)).toContain('broken-json');
 expect(rows.map((row:any)=>row.id)).toContain('broken-state');
 reopened.close();repo.close();
});
it('reports when every save row is corrupt without deleting any row',async()=>{
 const name='test-all-corrupt';const repo=new repository.SaveRepository(indexedDB,name);await repo.save(s);
 const db=await new Promise<IDBDatabase>((resolve,reject)=>{
  const req=indexedDB.open(name,1);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
 });
 await new Promise<void>((resolve,reject)=>{
  const tx=db.transaction('saves','readwrite');tx.objectStore('saves').put({id:'slot',json:'{',order:1});
  tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
 });
 db.close();
 await expect(repo.list()).rejects.toThrow('有効なセーブがありません');
 expect(repo.warnings).toEqual(['破損セーブ slot をスキップしました']);
 expect(await repo.rows()).toEqual([{id:'slot',json:'{',order:1}]);
 repo.close();
});

