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
  assert.deepEqual(cycle.events.map((event) => event.stage), [
    "research",
    "world-model",
    "gap-analysis",
    "style-compile",
    "counterfactual",
    "purchase-impact",
    "critic-swarm",
    "meta-learning",
    "constitutional-audit",
    "promotion"
  ]);
  assert.equal(cycle.artifacts.gap.label, "Refined black base layer");
  assert.equal(cycle.artifacts.counterfactuals.length, 3);
  assert.equal(cycle.artifacts.purchaseImpact.transactionAttempted, false);
  assert.notEqual(after.activePolicy.id, before.activePolicy.id);
  assert.equal(after.stats.cycles, 1);
  assert.equal(after.stats.constitutionalViolations, 0);
});

test("keeps cycle evidence typed and performs no paid or external action", () => {
  const db = initializeDatabase(":memory:");
  const cycle = new AutonomousFashionEngine(db).runCycle({ trigger:"side-effect-check" });

  assert.deepEqual(
    [...new Set(cycle.events.map((event) => event.evidenceType))].sort(),
    ["belief","constitutional-fact","counterfactual","decision","observation","prediction","synthetic"].sort()
  );
  assert.equal(cycle.constitution.providerCalls, 0);
  assert.equal(cycle.constitution.billableCost, 0);
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM generation_jobs").get().count, 0);
  assert.equal(db.prepare("SELECT transaction_attempted FROM purchase_impact_scenarios").get().transaction_attempted, 0);
});
