import test from "node:test";
import assert from "node:assert/strict";
import {
  escapeHtml,
  renderAgentCards,
  renderCycleHistory,
  renderCycleTimeline,
  renderMetricCards
} from "../public/autonomy-view.js";

test("escapes autonomous evidence before rendering", () => {
  assert.equal(escapeHtml('<script data-x="1">'), "&lt;script data-x=&quot;1&quot;&gt;");
});

test("renders agents and evidence timeline with semantic state", () => {
  const agents = renderAgentCards([{ id:"research", name:"Research Director", state:"ready", mandate:"Discover gaps" }]);
  assert.match(agents, /Research Director/);
  assert.match(agents, /data-state="ready"/);

  const timeline = renderCycleTimeline({ events:[{
    sequence:1,
    stage:"research",
    agent:"Research Director",
    summary:"Gap found",
    evidenceType:"observation"
  }] });
  assert.match(timeline, /Gap found/);
  assert.match(timeline, /OBSERVATION/);
});

test("renders stable empty and populated metric and history states", () => {
  assert.match(renderCycleTimeline(null), /No autonomous cycle has run/);
  assert.match(renderCycleHistory([]), /No completed cycles/);
  const metrics = renderMetricCards({ stats:{cycles:2,events:20,policies:3,constitutionalViolations:0} });
  assert.match(metrics, />2</);
  assert.match(metrics, /Constitutional violations/);
  const history = renderCycleHistory([{id:"cycle-safe",decision:"promoted",utilityDelta:0.04,createdAt:"2026-08-29 12:00:00"}]);
  assert.match(history, /PROMOTED/);
  assert.match(history, /\+0\.04/);
});
