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
 expect(workflow).toContain('workflow_dispatch');
 expect(workflow).toContain('assembleRelease');
 expect(workflow).toContain('apksigner verify');
 expect(workflow).toContain('secrets.PCT_ANDROID_KEYSTORE_BASE64');
 expect(workflow).toContain('app-release.apk');
 expect(gradle).not.toContain('storePassword "');
 expect(workflow).not.toContain('BEGIN PRIVATE KEY');
});
