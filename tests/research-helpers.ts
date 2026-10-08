/** Marks stages 1..level of a research branch (and the compute foundation each stage requires) as completed. */
export function unlockBranch<T extends {research:{completed:string[]}}>(s:T,category:string,axis:string,level:number):T{
 const add=(id:string)=>{if(!s.research.completed.includes(id))s.research.completed.push(id);};
 for(let i=1;i<=level;i++){
  if(axis!=='compute')for(let c=1;c<=Math.ceil(i/5);c++)add(`${category}-compute-${c}`);
  add(`${category}-${axis}-${i}`);
 }
 return s;
}
