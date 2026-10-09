import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

/** Only stable, canonical semver tags matching package.json can publish Android Releases. */
export function validateReleaseTag(tag,packageVersion){
 if(typeof tag!=='string'||!/^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(tag)){
  throw new Error('Release tag must be vMAJOR.MINOR.PATCH (stable semver, no leading zeros).');
 }
 const version=tag.slice(1);
 if(version!==packageVersion){
  throw new Error(`Release tag ${tag} does not match package.json version ${packageVersion}.`);
 }
 return version;
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
  process.stdout.write(validateReleaseTag(process.argv[2],pkg.version)+'\n');
 }catch(error){
  console.error(error instanceof Error?error.message:String(error));
  process.exitCode=1;
 }
}
