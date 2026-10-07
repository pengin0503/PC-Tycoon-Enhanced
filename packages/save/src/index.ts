import {gameSchema, type GameState} from '../../sim/src/index';
export const MAX_SAVE_BYTES=5*1024*1024;
export function migrateSave(value: unknown): GameState {
  if (typeof value!=='object' || value===null || Array.isArray(value)) throw new Error('セーブ形式が不正です');
  const old=value as Record<string,unknown>;
  if(old.version===0) {
    if(typeof old.company!=='object'||old.company===null) throw new Error('旧セーブが不正です');
    const {cash,...rest}=old;
    return gameSchema.parse({...rest,version:1,company:{...old.company,cash}});
  }
  return gameSchema.parse(value);
}
export function importSave(json: string): GameState {
  if(typeof json!=='string' || new TextEncoder().encode(json).length>MAX_SAVE_BYTES) throw new Error('セーブは5 MiB以内にしてください');
  return migrateSave(JSON.parse(json));
}
export function exportSave(state: GameState): string {
  const json=JSON.stringify(gameSchema.parse(state));
  if(new TextEncoder().encode(json).length>MAX_SAVE_BYTES) throw new Error('セーブ容量が上限を超えました');
  return json;
}
