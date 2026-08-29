import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { initializeDatabase } from "../src/database.mjs";
import { FashionIdentityService } from "../src/services.mjs";

test("seeds catalog, prompts, levels, and creates a non-billable proof receipt", () => {
  const dir = mkdtempSync(join(tmpdir(),"fashion-identity-test-"));
  const db = initializeDatabase(join(dir,"test.sqlite"));
  const service = new FashionIdentityService(db);
  assert.deepEqual(service.stats(),{products:15,outfitPrompts:200,progressionLevels:6,generationJobs:0});
  const job = service.createJob({outfitPromptId:"prompt-001",progressionLevelId:"north-star",provider:"mock"});
  assert.equal(job.status,"queued");
  const proofed = service.runProofJob(job.id);
  assert.equal(proofed.status,"proofed");
  assert.equal(proofed.providerReceipt.generatedImage,false);
  assert.equal(proofed.providerReceipt.billable,false);
});
