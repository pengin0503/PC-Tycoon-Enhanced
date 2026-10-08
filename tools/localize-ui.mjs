// Extract static Japanese UI strings into stable keys without changing rendered copy.
import ts from 'typescript';
import {readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const directory=new URL('../apps/web/src/',import.meta.url);
const japanese=/[\u3040-\u30ff\u3400-\u9fff]/;
const messages={};const printer=ts.createPrinter({newLine:ts.NewLineKind.LineFeed});
const call=(text)=>{const key='ui_'+createHash('sha1').update(text).digest('hex').slice(0,12);messages[key]=text;return ts.factory.createCallExpression(ts.factory.createIdentifier('uiText'),undefined,[ts.factory.createStringLiteral(key)]);};
for(const filename of await readdir(directory)){
 if(!filename.endsWith('.tsx'))continue;const url=new URL(filename,directory);const input=await readFile(url,'utf8');
 const source=ts.createSourceFile(filename,input,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let changed=false;
 const transformed=ts.transform(source,[context=>root=>{
  const visit=node=>{
   if(ts.isJsxAttribute(node)&&node.initializer&&ts.isStringLiteral(node.initializer)&&japanese.test(node.initializer.text)){changed=true;return ts.factory.updateJsxAttribute(node,node.name,ts.factory.createJsxExpression(undefined,call(node.initializer.text)));}
   if(ts.isJsxText(node)&&japanese.test(node.text)){changed=true;return ts.factory.createJsxExpression(undefined,call(node.text.replace(/\s+/g,' ')));}
   if(ts.isStringLiteral(node)&&japanese.test(node.text)&&!ts.isImportDeclaration(node.parent)){changed=true;return call(node.text);}
   return ts.visitEachChild(node,visit,context);
  };return ts.visitNode(root,visit);
 }]);
 if(changed)await writeFile(url,"import { t as uiText } from './i18n';\n"+printer.printFile(transformed.transformed[0]));transformed.dispose();
}
// Append existing entries so running again never discards keys already in source.
const output=new URL('strings.generated.ts',directory);let old={};try{const text=await readFile(output,'utf8');old=JSON.parse(text.slice(text.indexOf('{'),text.lastIndexOf('}')+1));}catch{}
await writeFile(output,'// Stable Japanese UI message keys. Edit translations here.\nexport const messages = '+JSON.stringify({...old,...messages},null,2)+' as const;\n');
