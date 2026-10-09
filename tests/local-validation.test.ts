import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';

it('provides Windows local full verification without GitHub Actions billing (#36)',()=>{
 const script=readFileSync('tools/verify-local.ps1','utf8');
 for(const step of [
  'npm', 'ci', 'typecheck', 'test', 'build', 'test:e2e', 'test:pwa',
  'unittest','discover','android:sync','gradlew.bat','assembleDebug',
  'verify_apk.py','apksigner','verify',
 ]){
  expect(script, `missing locally runnable CI step: ${step}`).toContain(step);
 }
 expect(script).toContain('ExpectedCommit');
 expect(script).toContain('SkipAndroid');
 expect(script).toContain('SkipBrowser');
 expect(script).toContain('SkipInstall');
 expect(script).toMatch(/LASTEXITCODE/);
 expect(script).not.toMatch(/gh\s+workflow\s+run/);
 expect(script).not.toMatch(/--force|git reset --hard|adb uninstall/);
});
