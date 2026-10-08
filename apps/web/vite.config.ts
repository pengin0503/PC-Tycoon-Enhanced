import {defineConfig} from 'vite';
import {offlineBuild} from './pwa-build';
import {fileURLToPath} from 'node:url';
export default defineConfig({plugins:[offlineBuild()],root:fileURLToPath(new URL('.',import.meta.url)),build:{outDir:'../../dist',emptyOutDir:true}});
