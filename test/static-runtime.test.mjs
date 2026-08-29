import test from "node:test";
import assert from "node:assert/strict";
import { createStaticApi } from "../public/static-runtime.js";

const fixtures = {
  "catalog-seed.json":[
    {sku:"RO-001",name:"Black Bomber",category:"outerwear",subcategory:"bomber",brand:"Rare One",colors:["black"],materials:["nylon"],rarity:8},
    {sku:"RO-002",name:"Dark Boot",category:"footwear",subcategory:"boot",brand:"Rare One",colors:["black"],materials:["leather"],rarity:7}
  ],
  "outfit-prompts.json":[
    {id:"prompt-001",promptNumber:1,outfitId:53,title:"Founder Noir",rawPrompt:"A black founder look."}
  ],
  "identity-progression.json":[{id:"north-star",label:"North Star",month:36}]
};

const fetchImpl = async (url) => ({
  ok:true,
  json:async () => fixtures[Object.keys(fixtures).find((name) => String(url).endsWith(name))]
});

test("runs the published Observatory as a zero-side-effect local simulation", async () => {
  const memory = new Map();
  const storage = { getItem:(key) => memory.get(key) ?? null, setItem:(key,value) => memory.set(key,value) };
  const api = createStaticApi({fetchImpl,storage,now:() => "2026-08-29T12:00:00.000Z",id:() => "fixture"});

  const before = await api("/api/autonomy/overview");
  assert.equal(before.mode,"published-static-simulation");
  assert.equal(before.stats.cycles,0);
  assert.equal((await api("/api/products?category=footwear")).length,1);

  const cycle = await api("/api/autonomy/cycles/run",{method:"POST"});
  assert.equal(cycle.decision,"promoted");
  assert.equal(cycle.events.length,10);
  assert.equal(cycle.constitution.externalSideEffects,0);
  assert.equal(cycle.constitution.providerCalls,0);
  assert.equal(cycle.artifacts.purchaseImpact.transactionAttempted,false);

  const after = await api("/api/autonomy/overview");
  assert.equal(after.stats.cycles,1);
  assert.equal(after.activePolicy.version,2);
  assert.equal((await api("/api/autonomy/cycles?limit=20")).length,1);
});
