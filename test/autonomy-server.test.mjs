import test from "node:test";
import assert from "node:assert/strict";
import { createFashionServer } from "../src/server.mjs";

test("serves and runs the autonomous loop over HTTP", async (t) => {
  const server = createFashionServer({ databasePath:":memory:" });
  await new Promise((resolve) => server.listen(0,"127.0.0.1",resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;

  const healthResponse = await fetch(`${base}/api/health`);
  assert.equal(healthResponse.status, 200);
  assert.deepEqual(await healthResponse.json(), {
    status:"ok",
    branch:"iteration/fully-autonomous",
    mode:"autonomous-internal",
    liveImageProvidersEnabled:false
  });

  const overviewResponse = await fetch(`${base}/api/autonomy/overview`);
  assert.equal(overviewResponse.status, 200);
  const overview = await overviewResponse.json();
  assert.equal(overview.branch, "iteration/fully-autonomous");
  assert.equal(overview.mode, "autonomous-internal");
  assert.equal(overview.stats.cycles, 0);

  const runResponse = await fetch(`${base}/api/autonomy/cycles/run`, {
    method:"POST",
    headers:{"content-type":"application/json"},
    body:JSON.stringify({trigger:"http-integration"})
  });
  assert.equal(runResponse.status, 201);
  const cycle = await runResponse.json();
  assert.equal(cycle.decision, "promoted");
  assert.equal(cycle.constitution.externalSideEffects, 0);

  const cyclesResponse = await fetch(`${base}/api/autonomy/cycles`);
  assert.equal(cyclesResponse.status, 200);
  const cycles = await cyclesResponse.json();
  assert.equal(cycles.length, 1);
  assert.equal(cycles[0].trigger, "http-integration");
});
