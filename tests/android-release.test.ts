import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const load=(path:string)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

it('publishes personal debug APK releases automatically from main without signing Secrets',()=>{
 const workflow=load('.github/workflows/android-release.yml');
 expect(workflow).toMatch(/push:\s*\n\s*branches:\s*\n\s*- main/);
 expect(workflow).toContain('workflow_dispatch:');
 expect(workflow).toContain('refs/heads/main');
 expect(workflow).toContain('contents: write');
 expect(workflow).toContain('assembleDebug');
 expect(workflow).not.toContain('assembleRelease');
 expect(workflow).not.toContain('secrets.PCT_ANDROID');
 expect(workflow).not.toContain('PCT_ANDROID_KEYSTORE');
 expect(workflow).toContain('gh release create');
 expect(workflow).toContain('--prerelease');
 expect(workflow).toContain('--draft');
 expect(workflow).toContain('--draft=false');
});

it('uses a unique semver-based beta tag for each run and matches Android manifest metadata',()=>{
 const workflow=load('.github/workflows/android-release.yml');
 const gradle=load('apps/android/android/app/build.gradle');
 expect(workflow).toContain('tools/release_version.mjs');
 expect(workflow).toContain('GITHUB_RUN_NUMBER');
 expect(workflow).toContain('-beta.');
 expect(workflow).toContain('PCT_VERSION_CODE');
 expect(workflow).toContain('PCT_VERSION_NAME');
 expect(gradle).toContain('PCT_VERSION_CODE');
 expect(gradle).toContain('PCT_VERSION_NAME');
 expect(workflow).toContain('aapt');
 expect(workflow).toContain("versionName='$PCT_VERSION_NAME'");
 expect(workflow).toContain("versionCode='$PCT_VERSION_CODE'");
});

it('verifies APK contents and signature and publishes a direct APK plus SHA256 only after upload',()=>{
 const workflow=load('.github/workflows/android-release.yml');
 expect(workflow).toContain('tools/verify_apk.py');
 expect(workflow).toMatch(/apksigner["']? verify/);
 expect(workflow).toContain('app-debug.apk');
 expect(workflow).toContain('PC-Tycoon-Enhanced-');
 expect(workflow).toContain('.sha256');
 expect(workflow).toContain('gh release view');
 expect(workflow).toContain('gh release edit');
 expect(workflow).not.toContain('actions/upload-artifact');
 expect(workflow).toMatch(/gh release create[\s\S]*?--draft/);
});
