import test from "node:test";
import assert from "node:assert/strict";
import prompts from "../data/outfit-prompts.json" with { type: "json" };

test("imports exactly one prompt for every outfit 053 through 252", () => {
  assert.equal(prompts.length, 200);
  assert.deepEqual(prompts.map((p) => p.outfitId), Array.from({length:200},(_,i)=>i+53));
  assert.equal(new Set(prompts.map((p) => p.id)).size, 200);
  assert.ok(prompts.every((p) => p.rawPrompt.length > 200));
});
