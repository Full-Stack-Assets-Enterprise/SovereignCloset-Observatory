import test from "node:test";
import assert from "node:assert/strict";
import prompts from "../data/outfit-prompts.json" with { type: "json" };
import levels from "../data/identity-progression.json" with { type: "json" };
import { composeGenerationPrompt, sanitizeOutfitPrompt, validateCompiledPrompt } from "../src/identity.mjs";

test("removes obsolete crimson hair phrase from imported source", () => {
  const clean = sanitizeOutfitPrompt(prompts[0].rawPrompt);
  assert.doesNotMatch(clean, /crimson[‑-]accented hair/i);
});

test("North Star prompt enforces the corrected identity canon", () => {
  const progression = levels.find((level) => level.id === "north-star");
  const result = composeGenerationPrompt({ outfitPrompt: prompts[0], progression });
  const validation = validateCompiledPrompt(result.compiledPrompt);
  assert.equal(validation.passed, true);
  assert.match(result.compiledPrompt, /exactly 5 inches/i);
  assert.doesNotMatch(result.compiledPrompt, /3\.5\s*(?:to|–|—|-)\s*4\.5/i);
  assert.match(result.compiledPrompt, /short dense black 360 waves/i);
  assert.match(result.compiledPrompt, /Do not depict aging or age progression/i);
  assert.match(result.compiledPrompt, /exactly one standalone/i);
});
