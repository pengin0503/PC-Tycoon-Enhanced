import {createHash} from 'node:crypto';
import {readdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,relative} from 'node:path';
import type {Plugin,ResolvedConfig} from 'vite';
export function offlineBuild():Plugin{
 let config:ResolvedConfig;
 return{name:'offline-shell',apply:'build',configResolved(c){config=c;},async closeBundle(){
  const root=resolve(config.root,config.build.outDir),files:string[]=[];
  async function walk(dir:string){for(const entry of await readdir(dir,{withFileTypes:true})){const path=resolve(dir,entry.name);if(entry.isDirectory())await walk(path);else if(entry.name!=='sw.js')files.push(relative(root,path).replaceAll('\\','/'));}}
  await walk(root);files.sort();const hash=createHash('sha256');for(const path of files){hash.update(path);hash.update(await readFile(resolve(root,path)));}
  const revision=hash.digest('hex').slice(0,20);
  await writeFile(resolve(root,'sw.js'),`/* Generated from production assets. Game data remains in IndexedDB. */
const CACHE='pt-shell-${revision}';
const assets=${JSON.stringify(files)}.map(path=>new URL(path,self.registration.scope).href);
const index=new URL('index.html',self.registration.scope).href;
self.addEventListener('install',event=>event.waitUntil((async()=>{
 try{const cache=await caches.open(CACHE);await cache.addAll(assets.map(url=>new Request(url,{cache:'reload'})));}
 catch(error){await caches.delete(CACHE);throw error;}
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 const names=await caches.keys();await Promise.all(names.filter(name=>name.startsWith('pt-shell-')&&name!==CACHE).map(name=>caches.delete(name)));await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);if(request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
 if(request.mode==='navigate'){event.respondWith((async()=>{const cache=await caches.open(CACHE);return await cache.match(index)||fetch(request);})());}
 else if(assets.includes(url.origin+url.pathname)){event.respondWith((async()=>{const cache=await caches.open(CACHE);return await cache.match(request,{ignoreSearch:true})||fetch(request);})());}
});
`);
 }};
}
