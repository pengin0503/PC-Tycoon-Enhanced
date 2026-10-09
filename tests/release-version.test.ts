import {it,expect} from 'vitest';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const run=(tag:string)=>spawnSync(process.execPath,['tools/release_version.mjs',tag],{cwd:root,encoding:'utf8'});

it('validates the exact semver release tag against the package version',()=>{
 const result=run('v0.1.0');
 expect(result.status).toBe(0);
 expect(result.stdout.trim()).toBe('0.1.0');
});
it.each(['v0.1.1','v1.0.0','main','v0.1','v0.1.0-beta.1','v0.1.0+build','v0.1.0;echo hacked','v01.1.0','v0.1.0\nINJECT=1'])('rejects invalid or mismatched release tag %s',tag=>{
 const result=run(tag);
 expect(result.status).not.toBe(0);
 expect(result.stdout).toBe('');
});
