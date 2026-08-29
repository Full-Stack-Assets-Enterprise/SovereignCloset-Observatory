import { randomUUID } from "node:crypto";
import { AutonomousFashionEngine } from "./autonomy.mjs";
import { composeGenerationPrompt, validateCompiledPrompt } from "./identity.mjs";
import { decodeJob, decodeLevel, decodeProduct, decodePrompt } from "./database.mjs";

export class FashionIdentityService {
  constructor(db) { this.db = db; this.autonomy = new AutonomousFashionEngine(db); }

  stats() {
    const scalar = (table) => this.db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count;
    return { products: scalar("products"), outfitPrompts: scalar("outfit_prompts"), progressionLevels: scalar("progression_levels"), generationJobs: scalar("generation_jobs") };
  }

  listProducts({ search = "", category = "", limit = 100 } = {}) {
    const clauses = []; const params = [];
    if (search) { clauses.push("(name LIKE ? OR brand LIKE ? OR sku LIKE ?)"); params.push(`%${search}%`,`%${search}%`,`%${search}%`); }
    if (category) { clauses.push("category = ?"); params.push(category); }
    const sql = `SELECT * FROM products ${clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""} ORDER BY rarity DESC, name LIMIT ?`;
    return this.db.prepare(sql).all(...params, Math.min(Number(limit) || 100, 500)).map(decodeProduct);
  }

  createProduct(input) {
    for (const key of ["sku","name","category","subcategory","brand"]) if (!input[key]) throw new Error(`${key} is required.`);
    const info = this.db.prepare(`INSERT INTO products (sku,name,category,subcategory,brand,colors_json,materials_json,details_json,rarity,source) VALUES (?,?,?,?,?,?,?,?,?,?)`)
      .run(input.sku,input.name,input.category,input.subcategory,input.brand,JSON.stringify(input.colors||[]),JSON.stringify(input.materials||[]),JSON.stringify(input.details||[]),Number(input.rarity)||1,input.source||"manual");
    return decodeProduct(this.db.prepare("SELECT * FROM products WHERE id=?").get(info.lastInsertRowid));
  }

  listProgressionLevels() {
    return this.db.prepare("SELECT * FROM progression_levels ORDER BY month").all().map(decodeLevel);
  }

  listPrompts({ search = "", limit = 40, offset = 0 } = {}) {
    const safeLimit = Math.min(Number(limit) || 40, 200); const safeOffset = Math.max(Number(offset) || 0, 0);
    const rows = search
      ? this.db.prepare("SELECT * FROM outfit_prompts WHERE title LIKE ? OR raw_prompt LIKE ? ORDER BY outfit_id LIMIT ? OFFSET ?").all(`%${search}%`,`%${search}%`,safeLimit,safeOffset)
      : this.db.prepare("SELECT * FROM outfit_prompts ORDER BY outfit_id LIMIT ? OFFSET ?").all(safeLimit,safeOffset);
    return rows.map(decodePrompt);
  }

  getPrompt(id) { return decodePrompt(this.db.prepare("SELECT * FROM outfit_prompts WHERE id=?").get(id)); }
  getLevel(id) { return decodeLevel(this.db.prepare("SELECT * FROM progression_levels WHERE id=?").get(id)); }

  compose(outfitPromptId, progressionLevelId) {
    const outfitPrompt = this.getPrompt(outfitPromptId);
    const progression = this.getLevel(progressionLevelId);
    if (!outfitPrompt) throw new Error("Outfit prompt not found.");
    if (!progression) throw new Error("Progression level not found.");
    const result = composeGenerationPrompt({ outfitPrompt, progression });
    return { outfitPrompt, progression, ...result, validation: validateCompiledPrompt(result.compiledPrompt) };
  }

  createJob({ outfitPromptId, progressionLevelId, provider = "mock" }) {
    if (provider !== "mock") throw new Error("Only the non-billable mock provider is enabled in this proof build.");
    const composed = this.compose(outfitPromptId, progressionLevelId);
    if (!composed.validation.passed) throw new Error("Compiled prompt failed the identity-policy gate.");
    const id = randomUUID();
    this.db.prepare("INSERT INTO generation_jobs (id,outfit_prompt_id,progression_level_id,provider,status,compiled_prompt,qa_json) VALUES (?,?,?,?,?,?,?)")
      .run(id,outfitPromptId,progressionLevelId,provider,"queued",composed.compiledPrompt,JSON.stringify(composed.validation));
    return this.getJob(id);
  }

  runProofJob(id) {
    const job = this.getJob(id);
    if (!job) throw new Error("Generation job not found.");
    if (job.provider !== "mock") throw new Error("A live image provider requires a later approved integration gate.");
    const receipt = { mode:"prompt-proof", generatedImage:false, billable:false, message:"Prompt passed composition and policy checks; no image provider was called." };
    this.db.prepare("UPDATE generation_jobs SET status='proofed', provider_receipt_json=?, updated_at=CURRENT_TIMESTAMP WHERE id=?").run(JSON.stringify(receipt),id);
    return this.getJob(id);
  }

  getJob(id) { return decodeJob(this.db.prepare("SELECT * FROM generation_jobs WHERE id=?").get(id)); }
  listJobs() { return this.db.prepare("SELECT * FROM generation_jobs ORDER BY created_at DESC LIMIT 100").all().map(decodeJob); }
  autonomyOverview() { return this.autonomy.overview(); }
  listAutonomyCycles(limit = 20) { return this.autonomy.listCycles(limit); }
  runAutonomyCycle(input = {}) { return this.autonomy.runCycle(input); }
}
