import { DatabaseSync } from "node:sqlite";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const moduleDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(moduleDir, "..");
const json = (path) => JSON.parse(readFileSync(resolve(projectRoot, path), "utf8"));

export function initializeDatabase(databasePath = resolve(projectRoot, "data/fashion-identity.sqlite")) {
  mkdirSync(dirname(databasePath), { recursive: true });
  const db = new DatabaseSync(databasePath);
  db.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;");
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sku TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      subcategory TEXT NOT NULL,
      brand TEXT NOT NULL,
      colors_json TEXT NOT NULL,
      materials_json TEXT NOT NULL,
      details_json TEXT NOT NULL,
      rarity INTEGER NOT NULL DEFAULT 1 CHECK (rarity BETWEEN 1 AND 10),
      source TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS progression_levels (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      month INTEGER NOT NULL,
      specification_json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS outfit_prompts (
      id TEXT PRIMARY KEY,
      prompt_number INTEGER NOT NULL UNIQUE,
      outfit_id INTEGER NOT NULL UNIQUE,
      title TEXT NOT NULL,
      raw_prompt TEXT NOT NULL,
      default_progression_level TEXT NOT NULL REFERENCES progression_levels(id),
      source TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS generation_jobs (
      id TEXT PRIMARY KEY,
      outfit_prompt_id TEXT NOT NULL REFERENCES outfit_prompts(id),
      progression_level_id TEXT NOT NULL REFERENCES progression_levels(id),
      provider TEXT NOT NULL,
      status TEXT NOT NULL,
      compiled_prompt TEXT NOT NULL,
      provider_receipt_json TEXT,
      qa_json TEXT,
      error TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS policy_genomes (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL,
      label TEXT NOT NULL,
      version INTEGER NOT NULL CHECK (version > 0),
      status TEXT NOT NULL CHECK (status IN ('challenger','active','retired','rejected','recovered')),
      parent_id TEXT REFERENCES policy_genomes(id),
      configuration_json TEXT NOT NULL,
      utility_estimate REAL NOT NULL CHECK (utility_estimate BETWEEN 0 AND 1),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS autonomous_cycles (
      id TEXT PRIMARY KEY,
      trigger TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('running','completed','failed','recovered')),
      active_stage TEXT NOT NULL,
      baseline_policy_id TEXT NOT NULL REFERENCES policy_genomes(id),
      challenger_policy_id TEXT REFERENCES policy_genomes(id),
      decision TEXT,
      utility_delta REAL,
      cycle_receipt_json TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT
    );
    CREATE TABLE IF NOT EXISTS autonomy_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cycle_id TEXT NOT NULL REFERENCES autonomous_cycles(id),
      sequence INTEGER NOT NULL,
      stage TEXT NOT NULL,
      agent TEXT NOT NULL,
      summary TEXT NOT NULL,
      evidence_type TEXT NOT NULL CHECK (evidence_type IN ('observation','belief','prediction','counterfactual','synthetic','constitutional-fact','decision')),
      evidence_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(cycle_id, sequence)
    );
    CREATE TABLE IF NOT EXISTS world_model_beliefs (
      id TEXT PRIMARY KEY,
      belief_key TEXT NOT NULL UNIQUE,
      scope TEXT NOT NULL,
      truth_type TEXT NOT NULL CHECK (truth_type IN ('observation','belief','prediction','counterfactual','synthetic','constitutional-fact')),
      value_json TEXT NOT NULL,
      confidence REAL NOT NULL CHECK (confidence BETWEEN 0 AND 1),
      source TEXT NOT NULL,
      cycle_id TEXT REFERENCES autonomous_cycles(id),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS wardrobe_gap_hypotheses (
      id TEXT PRIMARY KEY,
      cycle_id TEXT NOT NULL REFERENCES autonomous_cycles(id),
      label TEXT NOT NULL,
      category TEXT NOT NULL,
      rationale TEXT NOT NULL,
      confidence REAL NOT NULL CHECK (confidence BETWEEN 0 AND 1),
      status TEXT NOT NULL,
      evidence_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS style_ir_artifacts (
      id TEXT PRIMARY KEY,
      cycle_id TEXT NOT NULL REFERENCES autonomous_cycles(id),
      compiler_version TEXT NOT NULL,
      input_json TEXT NOT NULL,
      ir_json TEXT NOT NULL,
      constraint_report_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS counterfactual_worlds (
      id TEXT PRIMARY KEY,
      cycle_id TEXT NOT NULL REFERENCES autonomous_cycles(id),
      variant TEXT NOT NULL,
      intervention_json TEXT NOT NULL,
      outcome_json TEXT NOT NULL,
      utility REAL NOT NULL CHECK (utility BETWEEN 0 AND 1),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS purchase_impact_scenarios (
      id TEXT PRIMARY KEY,
      cycle_id TEXT NOT NULL REFERENCES autonomous_cycles(id),
      candidate_json TEXT NOT NULL,
      impact_json TEXT NOT NULL,
      transaction_attempted INTEGER NOT NULL DEFAULT 0 CHECK (transaction_attempted IN (0,1)),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS constitutional_receipts (
      id TEXT PRIMARY KEY,
      cycle_id TEXT NOT NULL UNIQUE REFERENCES autonomous_cycles(id),
      passed INTEGER NOT NULL CHECK (passed IN (0,1)),
      receipt_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS recovery_events (
      id TEXT PRIMARY KEY,
      cycle_id TEXT NOT NULL REFERENCES autonomous_cycles(id),
      reason TEXT NOT NULL,
      checkpoint_policy_id TEXT NOT NULL REFERENCES policy_genomes(id),
      receipt_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_prompts_outfit ON outfit_prompts(outfit_id);
    CREATE INDEX IF NOT EXISTS idx_jobs_status ON generation_jobs(status);
    CREATE INDEX IF NOT EXISTS idx_autonomous_cycles_created ON autonomous_cycles(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autonomy_events_cycle ON autonomy_events(cycle_id, sequence);
    CREATE INDEX IF NOT EXISTS idx_policy_genomes_status ON policy_genomes(status);
    CREATE INDEX IF NOT EXISTS idx_world_model_scope ON world_model_beliefs(scope);
  `);

  seed(db);
  return db;
}

function seed(db) {
  const productCount = db.prepare("SELECT COUNT(*) AS count FROM products").get().count;
  if (productCount === 0) {
    const insert = db.prepare(`INSERT INTO products
      (sku,name,category,subcategory,brand,colors_json,materials_json,details_json,rarity,source)
      VALUES (?,?,?,?,?,?,?,?,?,?)`);
    for (const item of json("data/catalog-seed.json")) {
      insert.run(item.sku,item.name,item.category,item.subcategory,item.brand,JSON.stringify(item.colors),JSON.stringify(item.materials),JSON.stringify(item.details),item.rarity,item.source);
    }
  }

  const levelCount = db.prepare("SELECT COUNT(*) AS count FROM progression_levels").get().count;
  if (levelCount === 0) {
    const insert = db.prepare("INSERT INTO progression_levels (id,label,month,specification_json) VALUES (?,?,?,?)");
    for (const level of json("data/identity-progression.json")) insert.run(level.id,level.label,level.month,JSON.stringify(level));
  }

  const promptCount = db.prepare("SELECT COUNT(*) AS count FROM outfit_prompts").get().count;
  if (promptCount === 0) {
    const insert = db.prepare(`INSERT INTO outfit_prompts
      (id,prompt_number,outfit_id,title,raw_prompt,default_progression_level,source)
      VALUES (?,?,?,?,?,?,?)`);
    for (const prompt of json("data/outfit-prompts.json")) insert.run(prompt.id,prompt.promptNumber,prompt.outfitId,prompt.title,prompt.rawPrompt,prompt.defaultProgressionLevel,prompt.source);
  }

  seedAutonomy(db);
}

function seedAutonomy(db) {
  const champion = {
    id: "autonomy-policy-v1",
    kind: "composition-meta-policy",
    label: "Constitutional Explorer",
    version: 1,
    status: "active",
    utility: 0.82,
    configuration: { explorationRate:0.12, noveltyBudget:0.28, provider:"none", externalSideEffects:false }
  };
  db.prepare(`INSERT OR IGNORE INTO policy_genomes
    (id,kind,label,version,status,parent_id,configuration_json,utility_estimate)
    VALUES (?,?,?,?,?,?,?,?)`)
    .run(champion.id,champion.kind,champion.label,champion.version,champion.status,null,JSON.stringify(champion.configuration),champion.utility);

  const catalogCount = db.prepare("SELECT COUNT(*) AS count FROM products").get().count;
  const promptCount = db.prepare("SELECT COUNT(*) AS count FROM outfit_prompts").get().count;
  const progressionCount = db.prepare("SELECT COUNT(*) AS count FROM progression_levels").get().count;
  const beliefs = [
    ["belief-catalog-entities","catalog-entities","catalog","observation",{count:catalogCount},1,"seeded-catalog"],
    ["belief-prompt-seeds","prompt-seeds","style-corpus","observation",{count:promptCount,range:"053-252"},1,"immutable-seed-corpus"],
    ["belief-progression-levels","progression-levels","digital-twin","observation",{count:progressionCount},1,"identity-progression"],
    ["belief-identity-canon","identity-canon","constitution","constitutional-fact",{gaugeInches:5,agingProhibited:true,standaloneImageOnly:true,hair:"short dense black 360 waves"},1,"human-authority"]
  ];
  const insert = db.prepare(`INSERT OR IGNORE INTO world_model_beliefs
    (id,belief_key,scope,truth_type,value_json,confidence,source)
    VALUES (?,?,?,?,?,?,?)`);
  for (const belief of beliefs) insert.run(belief[0],belief[1],belief[2],belief[3],JSON.stringify(belief[4]),belief[5],belief[6]);
}

export function decodeProduct(row) {
  return row && {
    id: row.id, sku: row.sku, name: row.name, category: row.category, subcategory: row.subcategory,
    brand: row.brand, colors: JSON.parse(row.colors_json), materials: JSON.parse(row.materials_json),
    details: JSON.parse(row.details_json), rarity: row.rarity, source: row.source, createdAt: row.created_at
  };
}

export function decodeLevel(row) {
  return row ? JSON.parse(row.specification_json) : null;
}

export function decodePrompt(row) {
  return row && {
    id: row.id, promptNumber: row.prompt_number, outfitId: row.outfit_id, title: row.title,
    rawPrompt: row.raw_prompt, defaultProgressionLevel: row.default_progression_level, source: row.source
  };
}

export function decodeJob(row) {
  return row && {
    id: row.id, outfitPromptId: row.outfit_prompt_id, progressionLevelId: row.progression_level_id,
    provider: row.provider, status: row.status, compiledPrompt: row.compiled_prompt,
    providerReceipt: row.provider_receipt_json ? JSON.parse(row.provider_receipt_json) : null,
    qa: row.qa_json ? JSON.parse(row.qa_json) : null, error: row.error,
    createdAt: row.created_at, updatedAt: row.updated_at
  };
}

export function decodePolicyGenome(row) {
  return row && {
    id: row.id,
    kind: row.kind,
    label: row.label,
    version: row.version,
    status: row.status,
    parentId: row.parent_id,
    configuration: JSON.parse(row.configuration_json),
    utilityEstimate: row.utility_estimate,
    createdAt: row.created_at
  };
}

export function decodeAutonomyCycle(row) {
  return row && {
    id: row.id,
    trigger: row.trigger,
    status: row.status,
    activeStage: row.active_stage,
    baselinePolicyId: row.baseline_policy_id,
    challengerPolicyId: row.challenger_policy_id,
    decision: row.decision,
    utilityDelta: row.utility_delta,
    receipt: row.cycle_receipt_json ? JSON.parse(row.cycle_receipt_json) : null,
    createdAt: row.created_at,
    completedAt: row.completed_at
  };
}

export function decodeAutonomyEvent(row) {
  return row && {
    id: row.id,
    cycleId: row.cycle_id,
    sequence: row.sequence,
    stage: row.stage,
    agent: row.agent,
    summary: row.summary,
    evidenceType: row.evidence_type,
    evidence: JSON.parse(row.evidence_json),
    createdAt: row.created_at
  };
}
