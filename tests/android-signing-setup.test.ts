import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const setup=()=>readFileSync(new URL('../tools/setup-android-signing.ps1',import.meta.url),'utf8');

it('configures the four required GitHub Actions signing secrets from a local keystore',()=>{
 const script=setup();
 for(const name of ['PCT_ANDROID_KEYSTORE_BASE64','PCT_ANDROID_KEYSTORE_PASSWORD','PCT_ANDROID_KEY_ALIAS','PCT_ANDROID_KEY_PASSWORD']){
  expect(script).toContain(name);
 }
 expect(script).toContain('ToBase64String');
 expect(script).toContain('gh');
 expect(script).toContain('keytool');
});
it('keeps credentials outside Git and GitHub workflow logs',()=>{
 const script=setup();
 expect(script).toContain('Read-Host -AsSecureString');
 expect(script).toContain('StandardInput.Write(');
 expect(script).toContain('RedirectStandardInput = $true');
 expect(script).toContain('Test-Path -LiteralPath $KeystorePath');
 expect(script).toContain('MyDocuments');
 expect(script).not.toContain('Set-Clipboard');
 expect(script).not.toMatch(/gh secret set[^\n]*--body/i);
 expect(script).not.toContain('storepass $');
});
