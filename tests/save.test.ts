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
