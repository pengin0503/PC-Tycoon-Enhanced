import type {GameState} from '../packages/sim/src/index';
/**
 * Tests predating mandatory specialists exercised hardware / AI / research in isolation.
 * Staff these scenarios explicitly; createGame itself still starts with no employees.
 */
export function withTestStaff<T extends GameState>(state:T,includeAI=false):T{
 const roles:GameState['staff'][number]['role'][]=['research','engineering','marketing',...(includeAI?['ai' as const]:[])];
 state.staff=roles.map((role,i)=>({id:`e-${i+1}`,role,skill:20,salary:0}));
 state.staffSeq=roles.length;
 return state;
}
