import test from "node:test";
import assert from "node:assert/strict";
import { createFashionServer } from "../src/server.mjs";

test("serves a distinct accessible Autonomy Observatory experience", async (t) => {
  const server = createFashionServer({ databasePath:":memory:" });
  await new Promise((resolve) => server.listen(0,"127.0.0.1",resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;

  const htmlResponse = await fetch(base);
  assert.match(htmlResponse.headers.get("content-type"), /text\/html/);
  const html = await htmlResponse.text();
  for (const marker of [
    "Autonomy Observatory",
    "Live Topology",
    "World Model",
    "Evolution Lab",
    "run-cycle",
    "cycle-status",
    "aria-live=\"polite\"",
    "FULL AUTONOMY · INTERNAL ONLY"
  ]) assert.match(html,new RegExp(marker));

  const cssResponse = await fetch(`${base}/styles.css`);
  assert.match(cssResponse.headers.get("content-type"), /text\/css/);
  const css = await cssResponse.text();
  assert.match(css,/--violet:/);
  assert.match(css,/@media\s*\(prefers-reduced-motion:\s*reduce\)/);

  const appResponse = await fetch(`${base}/app.js`);
  assert.match(appResponse.headers.get("content-type"), /text\/javascript/);
  const app = await appResponse.text();
  assert.match(app,/\/api\/autonomy\/overview/);
  assert.match(app,/\/api\/autonomy\/cycles\/run/);
  assert.match(app,/\.\/autonomy-view\.js/);
});
