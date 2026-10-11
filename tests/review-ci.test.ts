import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
it('publishes only the same-run verified APK from repository main',()=>{
 const ci=readFileSync('.github/workflows/ci.yml','utf8'),manual=readFileSync('.github/workflows/android-release.yml','utf8');
 expect(ci).toContain('workflow_call:');expect(ci).toContain('needs: [game, android]');
 expect(ci).toContain("github.repository == 'pengin0503/PC-Tycoon-Enhanced'");
 expect(ci).toContain("github.ref == 'refs/heads/main'");
 const release=ci.slice(ci.indexOf('  release:'));
 expect(release).toContain('actions/download-artifact');expect(release).toContain('pc-tycoon-debug-apk');
 expect(release).not.toContain('assembleDebug');expect(release).not.toContain('npm test');
 expect(manual).not.toContain('push:');expect(manual).toContain('uses: ./.github/workflows/ci.yml');
});
