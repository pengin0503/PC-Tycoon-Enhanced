import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
let revision='initial',fail=false;
const root=resolve('dist');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.woff2':'font/woff2','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'};
createServer(async(req,res)=>{
 const url=new URL(req.url,'http://127.0.0.1');
 if(url.pathname==='/__revision'&&req.method==='POST'){revision=url.searchParams.get('value')??'initial';fail=url.searchParams.get('fail')==='1';res.end('ok');return;}
 const path=resolve(root,'.'+(url.pathname==='/'?'/index.html':url.pathname));
 if(!path.startsWith(root+'/')){res.writeHead(403).end();return;}
 try{let bytes=await readFile(path);
  if(fail&&path.endsWith('.woff2')){res.writeHead(503).end();return;}
  if(path.endsWith('/sw.js'))bytes=Buffer.from(bytes.toString().replace(/pt-shell-[a-f0-9]+/g,`pt-shell-${revision}`));
  if(path.endsWith('/index.html'))bytes=Buffer.from(bytes.toString().replace('</head>',`<meta name="test-revision" content="${revision}"></head>`));
  res.writeHead(200,{'content-type':mime[extname(path)]??'application/octet-stream','cache-control':'no-store'}).end(bytes);
 }catch{res.writeHead(404).end();}
}).listen(4180,'127.0.0.1');
