import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const load=(path:string)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

it('one-time Windows setup registers all four signing secrets from a persistent keystore',()=>{
 const script=load('tools/setup-android-signing.ps1');
 for(const name of ['PCT_ANDROID_KEYSTORE_BASE64','PCT_ANDROID_KEYSTORE_PASSWORD','PCT_ANDROID_KEY_ALIAS','PCT_ANDROID_KEY_PASSWORD']){
  expect(script).toContain(name);
 }
 expect(script).toContain('ToBase64String');
 expect(script).toContain('keytool');
 expect(script).toContain('gh secret list');
});
it('does not expose signing credentials via command lines, logs or clipboard',()=>{
 const script=load('tools/setup-android-signing.ps1');
 expect(script).toContain('-AsSecureString');
 expect(script).toContain('StandardInput.Write(');
 expect(script).toContain('RedirectStandardInput = $true');
 expect(script).toContain('Test-Path -LiteralPath $KeystorePath');
 expect(script).toContain('MyDocuments');
 expect(script).toContain('AllowReplace');
 expect(script).not.toContain('Set-Clipboard');
 expect(script).not.toMatch(/gh secret set[^\n]*--body/i);
 expect(script).not.toContain('-storepass ');
});
it('parses the PowerShell setup in CI without touching secrets or installing a key',()=>{
 expect(load('.github/workflows/ci.yml')).toContain('pwsh -NoProfile -File tools/setup-android-signing.ps1 -ValidateOnly');
});
