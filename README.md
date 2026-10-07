# PC Tycoon Enhanced

Independent offline technology-company simulation. Japanese UI, strict TypeScript engine, React/Vite browser frontend. All engineering scores and prices are fictional gameplay values; no real LLM training or inference.

Node 24+: `npm ci`, `npm run dev`. Verify: `npm test`, `npm run typecheck`, `npm run build`, `npx playwright install chromium`, `npm run test:e2e`.

Modules: `packages/sim` pure state transitions; `packages/content` game data; `packages/save` versioned JSON/IndexedDB; `apps/web` responsive UI. Use [development status](docs/dev/STATUS.md) and Git history to resume. Production build is `dist/`.

One game month is 30 days. Time progresses only through commands or the visible-page timer. Save/export errors are displayed and do not clear the in-memory game. Local browser storage can be cleared by the browser; keep JSON exports as backups.
