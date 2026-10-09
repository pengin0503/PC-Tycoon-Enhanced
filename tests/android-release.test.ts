import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const load=(path:string)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

it('release APK signing requires an external persistent keystore and never embeds signing secrets',()=>{
 const gradle=load('apps/android/android/app/build.gradle');
 const workflow=load('.github/workflows/android-release.yml');
 expect(gradle).toContain('PCT_ANDROID_KEYSTORE_FILE');
 expect(gradle).toContain('PCT_ANDROID_KEYSTORE_PASSWORD');
 expect(gradle).toContain('PCT_ANDROID_KEY_ALIAS');
 expect(gradle).toContain('PCT_ANDROID_KEY_PASSWORD');
 expect(workflow).toContain("tags:");
 expect(workflow).toContain('assembleRelease');
 expect(workflow).toMatch(/apksigner["']? verify/);
 expect(workflow).toContain('secrets.PCT_ANDROID_KEYSTORE_BASE64');
 expect(workflow).toContain('app-release.apk');
 expect(gradle).not.toContain('storePassword "');
 expect(workflow).not.toContain('BEGIN PRIVATE KEY');
});

it('tag pushes publish verified signed APK files directly to GitHub Releases',()=>{
 const gradle=load('apps/android/android/app/build.gradle');
 const workflow=load('.github/workflows/android-release.yml');
 expect(workflow).toContain('refs/tags/');
 expect(workflow).toContain('contents: write');
 expect(workflow).toContain('tools/release_version.mjs');
 expect(workflow).toContain('PCT_VERSION_NAME');
 expect(workflow).toContain('aapt');
 expect(workflow).toContain('gh release create');
 expect(workflow).toContain('--verify-tag');
 expect(workflow).toContain('PC-Tycoon-Enhanced-');
 expect(workflow).toContain('.apk.sha256');
 expect(workflow).toContain('secrets.PCT_ANDROID_KEYSTORE_BASE64');
 expect(workflow).toMatch(/gh release create[\s\S]*?--verify-tag/);
 expect(gradle).toContain('PCT_VERSION_NAME');
});
