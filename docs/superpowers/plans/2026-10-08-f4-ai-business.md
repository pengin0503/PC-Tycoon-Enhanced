# F4 AI Business Implementation Plan
> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans; Native, no subagents.
**Goal:** Playable fictional Dense/MoE design, training/evaluation, finite shared compute and API/subscription/open-weight commercialization.
**Architecture:** Pure validated engineering approximations are separate from lifecycle/economy commands. Own GPU/server stock or original vendor catalog feeds clusters. Training and hosted services exclusively reserve a cluster; costs use existing integer finances.
**Tech Stack:** Existing TypeScript/Zod/React/Vitest/Playwright.
**Spec:** docs/superpowers/specs/2026-10-08-pc-tycoon-enhanced-foundation-design.md
## Global Constraints
- 学習計算量の初期近似: F_train ≈ 6 × P_active × T FLOP。
- 重み保存容量: P_total × bits / 8 bytes。KVキャッシュと予約メモリは別に加算。
- Denseでは両者一致、MoEでは P_active <= P_total。
- ゲーム内ベンチマークは「架空」と明示。実学習／実推論は行わない。
- GPU/VRAM/クラスタ/電力/設備投資を学習と推論費用へ反映。
## Review Focus
- Dense/MoE/shape/token/budget invalidity must reject before spending (Task 1/2).
- MoE memory uses total weights, and lower bits reduce memory with quality penalty (Task 1).
- Own hardware inventory is consumed only once; finite VRAM and exclusive reservations (Task 1/2).
- Training completion/failure and restored continuations are deterministic; scores saturate below100 (Task 2).
- Hosted revenue is capacity limited and pays power/operations/depreciation/fees; open release is real reputation benefit without fictitious API income (Task 2).
### Task 1: Engineering and clusters
**Files:** packages/content/src/{ai,research}.ts; packages/sim/src/{ai-math,ai,schema,index}.ts; tests/ai-math.test.ts.
**Interfaces:** LLMDesign{architecture,total,active,layers,hidden,attention,context,tokens,quality,diversity}; estimateLLM(design,cluster)→trainingFlops/seconds/cost/trainingMemory; estimateInference(design,cluster,bits,context,batch)→weights/KV/reserve/memory/tokensPerSecond/qualityPenalty. buyCluster{gpuId,serverId,gpus,network,cooling}. Vendor GPU references or own product IDs.
- [x] Tests literal 1B active×1B tokens gives6e18FLOP,1B 16-bit weights2e9bytes,KV805306368bytes for24layers×2048hidden×4096context; MoE8B/1B same rawFLOP and larger total memory; monotonic bits/VRAM/speed; bad geometry/Dense/MoE reject; finite positive costs and budget-fit cluster purchase.
- [x] `npm test -- tests/ai-math.test.ts` → RED.
- [x] Implement content coefficients, numeric validators, bounded/saturating metrics and finite hardware purchasing.
- [x] `npm test && npm run typecheck` → PASS.
- [x] Commit `feat: add LLM engineering and compute clusters`.
### Task 2: Training serving and AI Lab
**Files:** packages/sim/src/{ai,ai-math,index,schema,hardware}.ts; apps/web/src/AIPanel.tsx; App.tsx; tests/ai-business.test.ts; tests/ai.spec.ts; STATUS.
**Interfaces:** trainModel{name,design,clusterId,budget}; deployModel{id,clusterId,bits,context,batch,mode:api|subscription|open,apiPrice,subscriptionPrice}; retireModel{id}; model training/ready/failed with five benchmark scores and real progress. Training expenses include data/power/operations/depreciation and founder/staff work. Daily hosted service charges limited token demand; monthly subscriptions charge active users; fees/refunds included. AI market quote and own GPU/server demand coupling.
- [x] Tests researched training completes, budget/VRAM/busy clusters reject without expense, scores0..99 and data quality has effects, low-quality failure seeded, quantization research gate, API and subscription revenues/costs, open reputation without hosting income, deterministic round trip and own-hardware coupling.
- [x] Unit and browser (build cluster→train→evaluate→API sales on mobile) commands → RED.
- [x] Implement actual tick lifecycle and responsive full-parameter Lab, cost/time/memory estimates, fictional benchmark tables and serving modes.
- [x] Full unit/typecheck/build/browser gates → PASS; self-review.
- [x] Commit `feat: add training and AI service business`; STATUS and nonforced phase push.
## Self-review
All AI-01–07 have callable engine paths and UI controls; parameters are absolute counts internally and billions in UI. Minimum one research week models team preparation even when raw compute is short. No network/model dependencies. Real-model predictive accuracy is not claimed.
