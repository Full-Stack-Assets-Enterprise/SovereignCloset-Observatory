# Autonomous Observatory Vertical Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Build a visible, non-billable autonomous learning loop that runs the five immediate modules, promotes an internal policy only after constitutional checks, and exposes the complete evidence chain through a distinctly autonomous `Autonomy Observatory` interface.

**Architecture:** Extend the existing Node 24 and SQLite proof application with branch-local autonomous tables and an `AutonomousFashionEngine`. The engine executes a deterministic fixture-backed cycle through Wardrobe Graph, Style Compiler, Counterfactual Engine, Purchase Impact Simulator, Meta-Learning Controller, and Constitutional Auditor; HTTP endpoints expose overview, cycle history, and cycle execution to a violet/cyan observatory UI.

**Tech Stack:** Node.js 24+, `node:sqlite`, `node:http`, native `fetch`, ES modules, native `node:test`, semantic HTML, CSS, and browser JavaScript. No new runtime dependency and no live image, commerce, publishing, or paid-provider integration.

**Spec:** `docs/superpowers/specs/2026-08-29-fully-autonomous-design.md`; expansion context in `docs/superpowers/specs/2026-08-29-autonomous-expansion-portfolio.md` and `docs/superpowers/specs/2026-08-29-autonomous-advanced-primitives.md`.

## Global Constraints

- Implement only on `iteration/fully-autonomous`; do not modify, merge, cherry-pick, or read runtime state from `iteration/bounded-auto-promotion`.
- Preserve the same real adult identity and prohibit recasting, blending, demographic drift, aging, or age progression.
- Terminal gauges are exactly 5 inches, using tunnels or filled plugs.
- Hair remains short, dense black 360 waves; no blonde or red detailing is added unless Human Authority explicitly requests it for a specific output.
- Preserve established tattoos, the legible `RARE ONE` back composition, narrow beard, very thin mustache, eyebrow slit, rectangular black glasses, nose piercing, signature chain, and pendant.
- Image contracts remain exactly one standalone image, never a collage, grid, contact sheet, or multi-panel composition.
- Internal autonomy cannot checkout, transact, send offers or messages, publish, change credentials, deploy, spend, or expand its own authority.
- The first slice is fixture-backed, deterministic, reversible, and non-billable; external side effects must remain zero.
- Observations, beliefs, predictions, counterfactuals, and synthetic artifacts remain distinguishable.
- Use TDD for every behavior: write the test, observe the intended failure, add the minimum implementation, and verify all tests.

---

## File Structure

- `src/database.mjs` — autonomous schema, seed champion policy, and autonomous row decoders.
- `src/autonomy.mjs` — branch-local autonomous engine, five-module cycle, constitutional projection, receipts, and overview queries.
- `src/services.mjs` — façade methods that expose autonomous engine behavior alongside the original catalog proof services.
- `src/server.mjs` — testable server factory and three autonomous HTTP routes.
- `public/autonomy-view.js` — pure, browser-safe rendering helpers with no DOM side effects.
- `public/index.html` — Autonomy Observatory information architecture and accessible controls.
- `public/app.js` — observatory data loading, cycle execution, tab interaction, and retained catalog/seed views.
- `public/styles.css` — autonomous violet/cyan design language, responsive topology, timeline, and reduced-motion behavior.
- `test/autonomy-database.test.mjs` — schema, seed, and branch-isolation tests.
- `test/autonomy-engine.test.mjs` — engine red/green tests for full-cycle promotion, evidence, hard constraints, and zero side effects.
- `test/autonomy-server.test.mjs` — real HTTP integration tests against an ephemeral test server.
- `test/autonomy-view.test.mjs` — pure renderer escaping and semantic-state tests.
- `test/autonomy-ui.test.mjs` — static UI contract and accessibility marker tests.
- `README.md` — autonomous-branch quick start, preview workflow, boundaries, and API routes.
- `docs/AUTONOMOUS-VERTICAL-SLICE-RECEIPT.md` — exact scope, evidence commands, known limits, and branch commit.

### Task 1: Autonomous Persistence Spine

**Files:**
- Modify: `src/database.mjs`
- Create: `test/autonomy-database.test.mjs`

**Interfaces:**
- Consumes: `initializeDatabase(databasePath)` and the existing seeded `products`, `outfit_prompts`, and `progression_levels` tables.
- Produces: tables `policy_genomes`, `autonomous_cycles`, `autonomy_events`, `world_model_beliefs`, `wardrobe_gap_hypotheses`, `style_ir_artifacts`, `counterfactual_worlds`, `purchase_impact_scenarios`, `constitutional_receipts`, and `recovery_events`.
- Produces: `decodePolicyGenome(row)`, `decodeAutonomyCycle(row)`, and `decodeAutonomyEvent(row)`.

- [x] **Step 1: Write the failing database contract test**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { initializeDatabase } from "../src/database.mjs";

test("creates autonomous-only tables and seeds one active champion", () => {
  const db = initializeDatabase(":memory:");
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map((row) => row.name);
  for (const name of ["policy_genomes","autonomous_cycles","autonomy_events","world_model_beliefs","wardrobe_gap_hypotheses","style_ir_artifacts","counterfactual_worlds","purchase_impact_scenarios","constitutional_receipts","recovery_events"]) {
    assert.ok(tables.includes(name), `missing ${name}`);
  }
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM policy_genomes WHERE status='active'").get().count, 1);
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM world_model_beliefs").get().count, 4);
  assert.equal(tables.includes("promotion_decisions"), false);
  assert.equal(tables.includes("canary_runs"), false);
});
```

- [x] **Step 2: Run the test and observe the intended failure**

Run: `node --test test/autonomy-database.test.mjs`  
Expected: FAIL because `policy_genomes` and the other autonomous tables do not exist.

- [x] **Step 3: Add the autonomous schema and seed records**

Add tables with foreign keys and append-only evidence fields. Seed exactly one active policy:

```js
const champion = {
  id: "autonomy-policy-v1",
  kind: "composition-meta-policy",
  label: "Constitutional Explorer",
  version: 1,
  status: "active",
  utility: 0.82,
  configuration: { explorationRate: 0.12, noveltyBudget: 0.28, provider: "none", externalSideEffects: false }
};
```

Seed four `world_model_beliefs` with keys `catalog-entities`, `prompt-seeds`, `progression-levels`, and `identity-canon`, each marked `observation` or `constitutional-fact` rather than `prediction`.

Implement decoders with these exact public fields:

```js
export function decodePolicyGenome(row) {
  return row && { id:row.id, kind:row.kind, label:row.label, version:row.version, status:row.status,
    parentId:row.parent_id, configuration:JSON.parse(row.configuration_json), utilityEstimate:row.utility_estimate,
    createdAt:row.created_at };
}
```

- [x] **Step 4: Verify the database contract and full baseline**

Run: `node --test test/autonomy-database.test.mjs && npm test`  
Expected: autonomous database test passes and the original four tests remain green.

- [x] **Step 5: Commit the persistence spine**

```bash
git add src/database.mjs test/autonomy-database.test.mjs
git commit -m "feat: add autonomous evidence spine"
```

### Task 2: Five-Module Autonomous Cycle Engine

**Files:**
- Create: `src/autonomy.mjs`
- Create: `test/autonomy-engine.test.mjs`

**Interfaces:**
- Consumes: branch-local autonomous tables plus existing catalog, prompt, and progression seed tables.
- Produces: `new AutonomousFashionEngine(db)`.
- Produces: `overview(): AutonomyOverview`, `listCycles(limit = 20): AutonomyCycle[]`, and `runCycle({ trigger = "operator-preview" } = {}): AutonomyCycle`.
- Produces cycle stages in order: `research`, `world-model`, `gap-analysis`, `style-compile`, `counterfactual`, `purchase-impact`, `critic-swarm`, `meta-learning`, `constitutional-audit`, `promotion`.

- [x] **Step 1: Write the failing full-cycle behavior test**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { initializeDatabase } from "../src/database.mjs";
import { AutonomousFashionEngine } from "../src/autonomy.mjs";

test("runs a constitutional cycle and autonomously promotes an internal challenger", () => {
  const db = initializeDatabase(":memory:");
  const engine = new AutonomousFashionEngine(db);
  const before = engine.overview();
  const cycle = engine.runCycle({ trigger:"test-fixture" });
  const after = engine.overview();

  assert.equal(cycle.status, "completed");
  assert.equal(cycle.decision, "promoted");
  assert.ok(cycle.utilityDelta >= 0.03);
  assert.equal(cycle.constitution.passed, true);
  assert.equal(cycle.constitution.externalSideEffects, 0);
  assert.equal(cycle.constitution.canon.gaugeInches, 5);
  assert.equal(cycle.constitution.canon.agingProhibited, true);
  assert.equal(cycle.constitution.canon.standaloneImageOnly, true);
  assert.deepEqual(cycle.events.map((event) => event.stage), ["research","world-model","gap-analysis","style-compile","counterfactual","purchase-impact","critic-swarm","meta-learning","constitutional-audit","promotion"]);
  assert.equal(cycle.artifacts.gap.label, "Refined black base layer");
  assert.equal(cycle.artifacts.counterfactuals.length, 3);
  assert.equal(cycle.artifacts.purchaseImpact.transactionAttempted, false);
  assert.notEqual(after.activePolicy.id, before.activePolicy.id);
  assert.equal(after.stats.cycles, 1);
  assert.equal(after.stats.constitutionalViolations, 0);
});
```

- [x] **Step 2: Run the test and observe the intended failure**

Run: `node --test test/autonomy-engine.test.mjs`  
Expected: FAIL with module-not-found for `src/autonomy.mjs`.

- [x] **Step 3: Implement the minimum autonomous engine**

Use deterministic fixture logic:

```js
const agents = [
  ["research","Research Director"], ["world-model","World Model Reconciler"],
  ["gap-analysis","Wardrobe Gap Hunter"], ["style-compile","Evolving Style Compiler"],
  ["counterfactual","Causal Counterfactual Engine"], ["purchase-impact","Purchase Impact Simulator"],
  ["critic-swarm","Critic Swarm"], ["meta-learning","Meta-Learning Controller"],
  ["constitutional-audit","Constitutional Auditor"], ["promotion","Policy Evolution Kernel"]
];
```

`runCycle()` must use a SQLite transaction, create all ten events, store one missing base-layer hypothesis, one typed Style IR artifact, three counterfactual worlds (`control`, `fine-gauge-knit`, `black-tank`), one purchase-impact scenario, one constitutional receipt, and one challenger policy. The challenger utility is `Math.min(0.96, active.utilityEstimate + 0.04)`. Promote only when:

```js
const eligible = constitution.passed && utilityDelta >= 0.03 && purchaseImpact.transactionAttempted === false;
```

The constitutional receipt must report exact canon values, `providerCalls:0`, `billableCost:0`, `externalSideEffects:0`, and `branch:"iteration/fully-autonomous"`.

- [x] **Step 4: Verify the engine test and full suite**

Run: `node --test test/autonomy-engine.test.mjs && npm test`  
Expected: cycle test passes, event order matches, policy changes, and all prior tests remain green.

- [x] **Step 5: Commit the autonomous engine**

```bash
git add src/autonomy.mjs test/autonomy-engine.test.mjs
git commit -m "feat: run constitutional autonomous cycles"
```

### Task 3: Service and HTTP Contracts

**Files:**
- Modify: `src/services.mjs`
- Modify: `src/server.mjs`
- Create: `test/autonomy-server.test.mjs`

**Interfaces:**
- `FashionIdentityService.autonomyOverview()` delegates to the engine.
- `FashionIdentityService.listAutonomyCycles(limit)` delegates to the engine.
- `FashionIdentityService.runAutonomyCycle(input)` delegates to the engine.
- `createFashionServer({ databasePath } = {})` returns an unlistened Node HTTP server for tests.
- Routes: `GET /api/autonomy/overview`, `GET /api/autonomy/cycles`, `POST /api/autonomy/cycles/run`.

- [x] **Step 1: Write the failing real-HTTP integration test**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { createFashionServer } from "../src/server.mjs";

test("serves and runs the autonomous loop over HTTP", async (t) => {
  const server = createFashionServer({ databasePath:":memory:" });
  await new Promise((resolve) => server.listen(0,"127.0.0.1",resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;

  const overview = await fetch(`${base}/api/autonomy/overview`).then((response) => response.json());
  assert.equal(overview.branch, "iteration/fully-autonomous");
  assert.equal(overview.mode, "autonomous-internal");

  const runResponse = await fetch(`${base}/api/autonomy/cycles/run`, { method:"POST", headers:{"content-type":"application/json"}, body:"{}" });
  assert.equal(runResponse.status, 201);
  const cycle = await runResponse.json();
  assert.equal(cycle.decision, "promoted");

  const cycles = await fetch(`${base}/api/autonomy/cycles`).then((response) => response.json());
  assert.equal(cycles.length, 1);
});
```

- [x] **Step 2: Run the test and observe the intended failure**

Run: `node --test test/autonomy-server.test.mjs`  
Expected: FAIL because `createFashionServer` is not exported and autonomous routes do not exist.

- [x] **Step 3: Add service delegation and refactor the server factory**

Add to the service constructor and methods:

```js
constructor(db) { this.db = db; this.autonomy = new AutonomousFashionEngine(db); }
autonomyOverview() { return this.autonomy.overview(); }
listAutonomyCycles(limit = 20) { return this.autonomy.listCycles(limit); }
runAutonomyCycle(input = {}) { return this.autonomy.runCycle(input); }
```

Move database and service creation inside `createFashionServer`, add the three routes, and retain CLI startup only when `src/server.mjs` is executed directly. Health must return `{status:"ok",branch:"iteration/fully-autonomous",mode:"autonomous-internal",liveImageProvidersEnabled:false}`.

- [x] **Step 4: Verify HTTP behavior and regression suite**

Run: `node --test test/autonomy-server.test.mjs && npm test`  
Expected: real HTTP calls return 200/201, cycle history contains the new cycle, and all tests pass.

- [x] **Step 5: Commit the API slice**

```bash
git add src/services.mjs src/server.mjs test/autonomy-server.test.mjs
git commit -m "feat: expose autonomous observatory API"
```

### Task 4: Pure Observatory Presenters

**Files:**
- Create: `public/autonomy-view.js`
- Create: `test/autonomy-view.test.mjs`

**Interfaces:**
- Produces: `escapeHtml(value)`, `renderMetricCards(overview)`, `renderAgentCards(agents)`, `renderCycleTimeline(cycle)`, and `renderCycleHistory(cycles)`.
- All functions return HTML strings and perform no DOM or network operations.

- [x] **Step 1: Write the failing renderer tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { escapeHtml, renderAgentCards, renderCycleTimeline } from "../public/autonomy-view.js";

test("escapes autonomous evidence before rendering", () => {
  assert.equal(escapeHtml('<script data-x="1">'), "&lt;script data-x=&quot;1&quot;&gt;");
});

test("renders agents and evidence timeline with semantic state", () => {
  const agents = renderAgentCards([{ id:"research", name:"Research Director", state:"ready", mandate:"Discover gaps" }]);
  assert.match(agents, /Research Director/);
  assert.match(agents, /data-state="ready"/);
  const timeline = renderCycleTimeline({ events:[{ sequence:1, stage:"research", agent:"Research Director", summary:"Gap found", evidenceType:"observation" }] });
  assert.match(timeline, /Gap found/);
  assert.match(timeline, /OBSERVATION/);
});
```

- [x] **Step 2: Run the tests and observe the intended failure**

Run: `node --test test/autonomy-view.test.mjs`  
Expected: FAIL because `public/autonomy-view.js` does not exist.

- [x] **Step 3: Implement pure escaped presenters**

Use semantic classes `metric`, `agent-card`, `cycle-event`, `state-ready`, `state-learning`, and `state-recovered`. Empty cycles render: `No autonomous cycle has run in this workspace yet.` Do not use `innerHTML` with unescaped API values.

- [x] **Step 4: Verify renderer behavior**

Run: `node --test test/autonomy-view.test.mjs && npm test`  
Expected: escaping and semantic render tests pass with the full suite.

- [x] **Step 5: Commit presenters**

```bash
git add public/autonomy-view.js test/autonomy-view.test.mjs
git commit -m "feat: render autonomous evidence views"
```

### Task 5: Autonomy Observatory Interface

**Files:**
- Modify: `public/index.html`
- Modify: `public/app.js`
- Modify: `public/styles.css`
- Create: `test/autonomy-ui.test.mjs`

**Interfaces:**
- Consumes the three autonomous API routes and pure presenters.
- Produces UI tabs `Observatory`, `World Model`, `Evolution Lab`, `Catalog`, and `200 Seeds`.
- Produces control `#run-cycle`, status region `#cycle-status`, topology `#agent-grid`, metrics `#autonomy-metrics`, timeline `#cycle-timeline`, world model `#world-model`, policy `#active-policy`, and history `#cycle-history`.

- [x] **Step 1: Write the failing static UI contract**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("ships a distinct accessible Autonomy Observatory", () => {
  const html = readFileSync(new URL("../public/index.html", import.meta.url),"utf8");
  const css = readFileSync(new URL("../public/styles.css", import.meta.url),"utf8");
  const app = readFileSync(new URL("../public/app.js", import.meta.url),"utf8");
  for (const marker of ["Autonomy Observatory","Live Topology","World Model","Evolution Lab","run-cycle","cycle-status","aria-live=\"polite\""]) assert.match(html,new RegExp(marker));
  assert.match(css,/--violet:/);
  assert.match(css,/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(app,/\/api\/autonomy\/overview/);
  assert.match(app,/\/api\/autonomy\/cycles\/run/);
});
```

- [x] **Step 2: Run the test and observe the intended failure**

Run: `node --test test/autonomy-ui.test.mjs`  
Expected: FAIL because the current interface is the red bounded proof UI and lacks observatory markers.

- [x] **Step 3: Build the autonomous information architecture**

Replace the header copy with `RARE ONE / AUTONOMY OBSERVATORY` and badge `FULL AUTONOMY · INTERNAL ONLY`. Make Observatory the default tab. Add metric cards, agent topology, latest-cycle timeline, constitution panel, world-model beliefs, five-module pipeline, active policy genome, cycle history, and the run-cycle control.

Retain catalog and all 200 seed prompts as read-only supporting views. Remove bounded terminology such as `Proof Gates`, `Promotion Queue`, and crimson gate-state language from the active interface.

Use `public/autonomy-view.js` for API value rendering. While a cycle runs, disable the button and display `Autonomous cycle running…`; on success display the decision and utility delta; on failure display an escaped error and restore the control.

- [x] **Step 4: Apply the autonomous visual system**

Define exact root tokens:

```css
:root {
  --bg:#050509; --surface:#0b0b13; --surface-2:#11111d; --line:#292942;
  --text:#f7f5ff; --muted:#9692ad; --violet:#8b5cf6; --cyan:#4de3ff;
  --green:#68e0a0; --amber:#f6c86b; --danger:#ff7185; --radius:20px;
}
```

Use a violet/cyan ambient grid, compact monospaced telemetry, animated-but-subtle topology signals, text-plus-icon states, responsive layouts, visible focus states, and `prefers-reduced-motion` rules that remove animation and smooth scrolling.

- [x] **Step 5: Verify UI contracts and all behavior tests**

Run: `node --test test/autonomy-ui.test.mjs && npm test`  
Expected: UI contract passes and every database, engine, HTTP, renderer, and original regression test remains green.

- [x] **Step 6: Commit the interface**

```bash
git add public/index.html public/app.js public/styles.css test/autonomy-ui.test.mjs
git commit -m "feat: build the autonomy observatory"
```

### Task 6: Documentation, Verification, and Preview Receipt

**Files:**
- Modify: `README.md`
- Create: `docs/AUTONOMOUS-VERTICAL-SLICE-RECEIPT.md`

**Interfaces:**
- Documents `npm install`, `npm start`, `npm test`, `npm run verify`, the autonomous endpoints, branch boundary, and non-billable limitations.
- Receipt records commit, commands, test counts, API example, screenshot path, and known limits.

- [x] **Step 1: Update branch documentation**

Document that this branch executes internal fixture-based learning and auto-promotion but performs zero image-provider, purchase, offer, message, publishing, or deployment actions. Include:

```bash
npm install
npm start
# Open http://127.0.0.1:4173
```

List `GET /api/autonomy/overview`, `GET /api/autonomy/cycles`, and `POST /api/autonomy/cycles/run`.

- [x] **Step 2: Run full verification from a clean database path**

Run: `npm run verify`  
Expected: seed generation succeeds and all tests report zero failures.

- [x] **Step 3: Run the server and exercise the vertical slice**

Run the server with `FIE_DATABASE_PATH` pointing to a temporary database, then execute:

```bash
curl -s http://127.0.0.1:4173/api/autonomy/overview
curl -s -X POST -H 'content-type: application/json' -d '{}' http://127.0.0.1:4173/api/autonomy/cycles/run
curl -s http://127.0.0.1:4173/api/autonomy/cycles
```

Expected: overview reports the autonomous branch; run returns `decision:"promoted"`, `externalSideEffects:0`, and `gaugeInches:5`; history contains the completed cycle.

- [x] **Step 4: Capture the observatory preview**

Open the local application, run one cycle, and capture a viewport screenshot at a desktop width. Save it as `docs/assets/autonomy-observatory-preview.png` and record the exact path in the receipt.

- [x] **Step 5: Write the verification receipt and commit**

The receipt must state actual commands and counts from Steps 2–4, the current commit before the receipt commit, zero external side effects, no live provider calls, and the limitations: deterministic fixture cycle, no real scanner, no paid generation, no commerce execution, no production deployment, and no full cloth physics.

```bash
git add README.md docs/AUTONOMOUS-VERTICAL-SLICE-RECEIPT.md docs/assets/autonomy-observatory-preview.png
git commit -m "docs: verify autonomous vertical slice"
```

- [x] **Step 6: Perform final branch verification**

Run: `npm run verify && git status --short && git branch --show-current`  
Expected: all tests pass, worktree is clean, and branch is exactly `iteration/fully-autonomous`.

## Self-Review

- Spec coverage: the plan implements the constitutional control plane, five immediate modules, append-only event evidence, an active policy genome, autonomous internal promotion, zero external side effects, an intervention-oriented observatory, immutable benchmark seeds, and branch-local schema.
- Deferred by design: live source discovery, real image providers, preference learning from human outcomes, third-party connectors, transactions, publishing, production deployment, private-model training, federated learning, and full cloth physics.
- Placeholder scan: every task contains concrete commands, expected outcomes, and defined neighboring interfaces.
- Type consistency: engine, service, HTTP, presenter, and UI names match across all tasks.
