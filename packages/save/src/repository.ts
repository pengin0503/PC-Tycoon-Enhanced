import type {GameState} from '../../sim/src/index';
import {exportSave,importSave} from './index';
type Row={id:string,json:string,order:number};
export class SaveRepository {
  private db?: Promise<IDBDatabase>;
  private closed=false;
  warnings:string[]=[];
  constructor(private factory: IDBFactory|undefined=globalThis.indexedDB,private name='pc-tycoon-enhanced'){}
  private open():Promise<IDBDatabase> {
    if(this.closed) return Promise.reject(new Error('保存接続は閉じています'));
    if(!this.factory) return Promise.reject(new Error('保存領域を利用できません。JSONを書き出してください'));
    if(!this.db) this.db=new Promise<IDBDatabase>((resolve,reject)=>{
      const req=this.factory!.open(this.name,1);
      req.onupgradeneeded=()=>{req.result.createObjectStore('saves',{keyPath:'id'});req.result.createObjectStore('meta');};
      req.onerror=()=>reject(req.error);
      req.onblocked=()=>reject(new Error('別のタブが保存領域を使用中です'));
      req.onsuccess=()=>{req.result.onversionchange=()=>req.result.close();if(this.closed)req.result.close();resolve(req.result);};
    }).catch(e=>{this.db=undefined;throw e;});
    return this.db;
  }
  async save(state:GameState):Promise<void> {
    const json=exportSave(state);const db=await this.open();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(['saves','meta'],'readwrite');
      const counter=tx.objectStore('meta').get('counter');
      counter.onsuccess=()=>{const order=(counter.result??0)+1;tx.objectStore('saves').put({id:state.id,json,order});tx.objectStore('meta').put(order,'counter');};
      tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error??new Error('保存が中断されました。空き容量を確認してください'));tx.onerror=()=>reject(tx.error);
    });
  }
  private async rows():Promise<Row[]> {
    const db=await this.open();return new Promise((resolve,reject)=>{
      const tx=db.transaction('saves','readonly');const req=tx.objectStore('saves').getAll();
      tx.oncomplete=()=>resolve(req.result as Row[]);tx.onabort=()=>reject(tx.error);tx.onerror=()=>reject(tx.error);
    });
  }
  async list():Promise<{id:string,day:number,name:string}[]> {
    this.warnings=[];
    const rows=(await this.rows()).sort((a,b)=>b.order-a.order);
    const slots:{id:string,day:number,name:string}[]=[];
    for(const row of rows){
      try{const s=importSave(row.json);slots.push({id:s.id,day:s.day,name:s.company.name});}
      catch{this.warnings.push(`破損セーブ ${row.id??'不明'} をスキップしました`);}
    }
    if(rows.length&&!slots.length)throw new Error('有効なセーブがありません。JSONから復元してください');
    return slots;
  }
  async load(id:string):Promise<GameState|null> {const row=(await this.rows()).find(r=>r.id===id);return row?importSave(row.json):null;}
  async latest():Promise<GameState|null> {
    this.warnings=[];
    const rows=(await this.rows()).sort((a,b)=>b.order-a.order);
    for(const row of rows) {try{return importSave(row.json);}catch{this.warnings.push(`破損セーブ ${row.id} をスキップしました`);}}
    if(rows.length) throw new Error('有効なセーブがありません。JSONから復元してください');
    return null;
  }
  async delete(id:string):Promise<void> {
    const db=await this.open();return new Promise((resolve,reject)=>{
      const tx=db.transaction('saves','readwrite');tx.objectStore('saves').delete(id);
      tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error);tx.onerror=()=>reject(tx.error);
    });
  }
  close(){this.closed=true;void this.db?.then(db=>db.close());}
}

