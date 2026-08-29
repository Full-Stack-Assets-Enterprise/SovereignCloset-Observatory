import test from "node:test";
import assert from "node:assert/strict";
import {
  decodeAutonomyCycle,
  decodeAutonomyEvent,
  decodePolicyGenome,
  initializeDatabase
} from "../src/database.mjs";

test("creates autonomous-only tables and seeds one active champion", () => {
  const db = initializeDatabase(":memory:");
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map((row) => row.name);

  for (const name of [
    "policy_genomes",
    "autonomous_cycles",
    "autonomy_events",
    "world_model_beliefs",
    "wardrobe_gap_hypotheses",
    "style_ir_artifacts",
    "counterfactual_worlds",
    "purchase_impact_scenarios",
    "constitutional_receipts",
    "recovery_events"
  ]) {
    assert.ok(tables.includes(name), `missing ${name}`);
  }

  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM policy_genomes WHERE status='active'").get().count, 1);
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM world_model_beliefs").get().count, 4);
  assert.equal(tables.includes("promotion_decisions"), false);
  assert.equal(tables.includes("canary_runs"), false);
});

test("decodes autonomous persistence rows into stable public contracts", () => {
  const db = initializeDatabase(":memory:");
  const policy = decodePolicyGenome(db.prepare("SELECT * FROM policy_genomes WHERE status='active'").get());
  assert.equal(policy.id, "autonomy-policy-v1");
  assert.equal(policy.configuration.provider, "none");
  assert.equal(policy.utilityEstimate, 0.82);

  db.prepare(`INSERT INTO autonomous_cycles
    (id,trigger,status,active_stage,baseline_policy_id,cycle_receipt_json)
    VALUES (?,?,?,?,?,?)`).run("cycle-1","test","running","research",policy.id,JSON.stringify({mode:"fixture"}));
  const cycle = decodeAutonomyCycle(db.prepare("SELECT * FROM autonomous_cycles WHERE id='cycle-1'").get());
  assert.deepEqual(
    {id:cycle.id,trigger:cycle.trigger,status:cycle.status,activeStage:cycle.activeStage,receipt:cycle.receipt},
    {id:"cycle-1",trigger:"test",status:"running",activeStage:"research",receipt:{mode:"fixture"}}
  );

  db.prepare(`INSERT INTO autonomy_events
    (cycle_id,sequence,stage,agent,summary,evidence_type,evidence_json)
    VALUES (?,?,?,?,?,?,?)`).run("cycle-1",1,"research","Research Director","Gap scan started","observation",JSON.stringify({sources:0}));
  const event = decodeAutonomyEvent(db.prepare("SELECT * FROM autonomy_events WHERE cycle_id='cycle-1'").get());
  assert.deepEqual(
    {sequence:event.sequence,stage:event.stage,agent:event.agent,evidenceType:event.evidenceType,evidence:event.evidence},
    {sequence:1,stage:"research",agent:"Research Director",evidenceType:"observation",evidence:{sources:0}}
  );
});
