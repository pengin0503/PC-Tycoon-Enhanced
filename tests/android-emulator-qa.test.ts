import {it,expect} from 'vitest';
import {readFileSync,existsSync} from 'node:fs';

/** Emulator is additive: it is not the physical device / stable production-key sign-off. */
it('runs an ADB install/update/back/offline/relaunch smoke on pull requests (#4)',()=>{
 const path='.github/workflows/android-emulator-qa.yml';
 expect(existsSync(path)).toBe(true);
 const workflow=readFileSync(path,'utf8');
 expect(workflow).toMatch(/pull_request:/);
 expect(workflow).toMatch(/reactivecircus\/android-emulator-runner@v2/);
 expect(workflow).toMatch(/android-emulator-smoke\.sh/);
 const script=readFileSync('tools/android-emulator-smoke.sh','utf8');
 expect(script).toMatch(/adb install -r/);
 expect(script).toMatch(/am force-stop/);
 expect(script).toMatch(/KEYCODE_BACK/);
 expect(script).toMatch(/run-as/);
 // Android's app-private files/ dir need not exist on first launch: create it under run-as before writing.
 expect(script).toMatch(/run-as\s+"\$PACKAGE"\s+mkdir\s+-p\s+files/);
 expect(script.indexOf('mkdir -p files')).toBeLessThan(script.indexOf('echo keep-save-data'));
 expect(script).toMatch(/svc wifi disable/);
 expect(script).not.toMatch(/adb uninstall/);
 expect(workflow).toMatch(/if: always\(\)/);
});
