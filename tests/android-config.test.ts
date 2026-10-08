import {readFileSync} from 'node:fs';
import {it,expect} from 'vitest';
import config from '../apps/android/capacitor.config';
const app=readFileSync(new URL('../apps/android/android/app/build.gradle',import.meta.url),'utf8');
it('Android package and native bridge identify the same application',()=>{
 const applicationId=app.match(/applicationId\s*[=]?\s*['"]([^'"]+)['"]/)!;
 expect(applicationId?.[1]).toBe(config.appId);
 const namespace=app.match(/namespace\s*[=]?\s*['"]([^'"]+)['"]/)!;
 expect(namespace?.[1]).toBe(config.appId);
});
it('native packaging uses the shared local web bundle without a remote server',()=>{
 expect(config.webDir).toBe('../../dist');expect(config.server?.url).toBeUndefined();
});

it('native lifecycle pauses WebView timers outside the active game',()=>{expect(config.cordova?.preferences?.KeepRunning).toBe('false');});
