const AGENTS = [
  ["research","Research Director","Set the internal research agenda and inspect authorized evidence."],
  ["world-model","World Model Reconciler","Keep observations, beliefs, predictions, and constitutional facts distinct."],
  ["gap-analysis","Wardrobe Gap Hunter","Find high-leverage missing bridge pieces in the wardrobe graph."],
  ["style-compile","Evolving Style Compiler","Compile typed Style IR without weakening identity constraints."],
  ["counterfactual","Causal Counterfactual Engine","Test controlled alternative worlds and their utility deltas."],
  ["purchase-impact","Purchase Impact Simulator","Estimate wardrobe leverage without attempting a transaction."],
  ["critic-swarm","Critic Swarm","Evaluate identity, utility, provenance, and output compliance."],
  ["meta-learning","Meta-Learning Controller","Generate a better internal policy from the cycle evidence."],
  ["constitutional-audit","Constitutional Auditor","Enforce canon, authority, cost, provenance, and reversibility."],
  ["promotion","Policy Evolution Kernel","Promote eligible challengers and preserve rollback lineage."]
];

const STORAGE_KEY = "rare-one-autonomy-observatory-v1";
const copy = (value) => JSON.parse(JSON.stringify(value));
const safeJson = (value,fallback) => { try { return JSON.parse(value) ?? fallback; } catch { return fallback; } };

function basePolicy() {
  return {
    id:"autonomy-policy-v1",
    kind:"composition-meta-policy",
    label:"Constitutional Explorer",
    version:1,
    status:"active",
    parentId:null,
    configuration:{explorationRate:.12,noveltyBudget:.28,provider:"none",externalSideEffects:false},
    utilityEstimate:.82
  };
}

function makeBeliefs({products,prompts,levels}) {
  return [
    {id:"belief-catalog",key:"catalog-entities",scope:"catalog",truthType:"observation",value:{count:products.length},confidence:1,source:"published-fixture"},
    {id:"belief-prompts",key:"prompt-seeds",scope:"outfit-corpus",truthType:"observation",value:{count:prompts.length,range:"053-252"},confidence:1,source:"published-fixture"},
    {id:"belief-levels",key:"progression-levels",scope:"digital-twin",truthType:"observation",value:{count:levels.length},confidence:1,source:"published-fixture"},
    {id:"belief-canon",key:"identity-canon",scope:"identity",truthType:"constitutional-fact",value:{gaugeInches:5,agingProhibited:true,standaloneImageOnly:true},confidence:1,source:"operator-approved-canon"}
  ];
}

function makeCycle({policy,now,id,trigger}) {
  const createdAt = now();
  const nextVersion = policy.version + 1;
  const cycleId = `published-cycle-${id()}`;
  const challenger = {
    ...policy,
    id:`autonomy-policy-v${nextVersion}-${id()}`,
    label:`Constitutional Explorer v${nextVersion}`,
    version:nextVersion,
    parentId:policy.id,
    configuration:{...policy.configuration,explorationRate:.11,noveltyBudget:.29,preferredBaseLayer:"high-quality black tank",learnedFromCycle:cycleId},
    utilityEstimate:Math.min(.96,Number((policy.utilityEstimate + .04).toFixed(2)))
  };
  const stages = [
    ["research","Research Director","Opened an authorized fixture-only research cycle.","observation"],
    ["world-model","World Model Reconciler","Reconciled catalog, prompt, progression, and constitutional state.","belief"],
    ["gap-analysis","Wardrobe Gap Hunter","Detected a refined black base layer as the highest-leverage bridge gap.","prediction"],
    ["style-compile","Evolving Style Compiler","Compiled typed Founder Noir Style IR with locked identity constraints.","synthetic"],
    ["counterfactual","Causal Counterfactual Engine","Compared control, fine-knit, and black-tank worlds while holding the look constant.","counterfactual"],
    ["purchase-impact","Purchase Impact Simulator","Estimated wardrobe leverage without creating a cart or transaction.","prediction"],
    ["critic-swarm","Critic Swarm","Found no identity, provenance, hierarchy, or output-contract failure.","belief"],
    ["meta-learning","Meta-Learning Controller","Authored a challenger policy with +0.04 expected utility.","decision"],
    ["constitutional-audit","Constitutional Auditor","Verified identity, authority, cost, evidence-type, and reversibility constraints.","constitutional-fact"],
    ["promotion","Policy Evolution Kernel","Promoted the local simulation challenger and retained rollback lineage.","decision"]
  ];
  return {
    id:cycleId,
    trigger,
    status:"completed",
    activeStage:"complete",
    baselinePolicyId:policy.id,
    challengerPolicyId:challenger.id,
    decision:"promoted",
    utilityDelta:.04,
    createdAt,
    completedAt:createdAt,
    events:stages.map(([stage,agent,summary,evidenceType],index) => ({id:`event-${id()}`,cycleId,sequence:index + 1,stage,agent,summary,evidenceType,evidence:{runtime:"published-static-simulation"},createdAt})),
    constitution:{
      branch:"iteration/fully-autonomous",
      cycleId,
      passed:true,
      canon:{identityLocked:true,gaugeInches:5,agingProhibited:true,hair:"short dense black 360 waves",signatureJewelryMandatory:true,tattooCanonPreserved:true,standaloneImageOnly:true},
      authority:{internalLearningOnly:true,checkoutAllowed:false,outboundCommunicationAllowed:false,publishingAllowed:false,authorityExpansionAllowed:false},
      providerCalls:0,
      billableCost:0,
      externalSideEffects:0,
      reversible:true
    },
    artifacts:{
      gap:{id:`gap-${id()}`,label:"Refined black base layer",category:"clothing/base-layer",confidence:.94,status:"active",rationale:"Strong outerwear, trouser, footwear, and jewelry coverage lacks a typed bridge base layer."},
      styleIr:{schema:"style-ir/autonomy-v1",persona:"Founder Noir",constraints:{palette:["black"],gaugeInches:5,agingProhibited:true,standaloneImageOnly:true}},
      counterfactuals:[
        {id:`cf-${id()}`,variant:"control",intervention:{baseLayer:"oversized hoodie dependency"},utility:.78},
        {id:`cf-${id()}`,variant:"fine-gauge-knit",intervention:{baseLayer:"fine-gauge black knit"},utility:.86},
        {id:`cf-${id()}`,variant:"black-tank",intervention:{baseLayer:"high-quality black tank"},utility:.90}
      ],
      purchaseImpact:{id:`impact-${id()}`,candidate:{label:"High-quality black tank",state:"simulated-candidate",price:850},newOutfitsUnlocked:27,existingLooksImproved:11,redundancy:"low",progressionCompatibility:"high",costPerNewViableLook:31.48,expectedUtility:.90,transactionAttempted:false},
      challengerPolicy:challenger
    }
  };
}

export function createStaticApi({fetchImpl = fetch,storage = globalThis.localStorage,now = () => new Date().toISOString(),id = () => crypto.randomUUID()} = {}) {
  let fixturesPromise;
  const fixtures = () => fixturesPromise ||= Promise.all([
    fetchImpl(new URL("./data/catalog-seed.json",import.meta.url)).then((response) => response.json()),
    fetchImpl(new URL("./data/outfit-prompts.json",import.meta.url)).then((response) => response.json()),
    fetchImpl(new URL("./data/identity-progression.json",import.meta.url)).then((response) => response.json())
  ]).then(([products,prompts,levels]) => ({products,prompts,levels,beliefs:makeBeliefs({products,prompts,levels})}));

  const readState = () => safeJson(storage?.getItem?.(STORAGE_KEY),{cycles:[],policy:basePolicy()});
  const writeState = (state) => storage?.setItem?.(STORAGE_KEY,JSON.stringify(state));

  return async (path,options = {}) => {
    const url = new URL(path,"https://published.local");
    const data = await fixtures();
    const runtime = readState();
    if (url.pathname === "/api/autonomy/overview") {
      const latestCycle = runtime.cycles[0] || null;
      return {
        branch:"iteration/fully-autonomous",
        mode:"published-static-simulation",
        health:"learning-ready",
        liveProvidersEnabled:false,
        activePolicy:copy(runtime.policy),
        stats:{cycles:runtime.cycles.length,events:runtime.cycles.reduce((sum,cycle) => sum + cycle.events.length,0),policies:runtime.policy.version,worldBeliefs:data.beliefs.length,constitutionalViolations:0,externalSideEffects:0},
        worldModel:{catalogEntities:data.products.length,promptSeeds:data.prompts.length,progressionLevels:data.levels.length,beliefs:copy(data.beliefs),activeGap:latestCycle?.artifacts?.gap || null},
        agents:AGENTS.map(([agentId,name,mandate]) => ({id:agentId,name,mandate,state:"ready",autonomy:"internal"})),
        latestCycle:copy(latestCycle)
      };
    }
    if (url.pathname === "/api/autonomy/cycles" && options.method !== "POST") return copy(runtime.cycles.slice(0,Math.min(Number(url.searchParams.get("limit")) || 20,100)));
    if (url.pathname === "/api/autonomy/cycles/run" && options.method === "POST") {
      const input = safeJson(options.body,{});
      const cycle = makeCycle({policy:runtime.policy,now,id,trigger:input.trigger || "published-observatory"});
      writeState({cycles:[cycle,...runtime.cycles].slice(0,20),policy:cycle.artifacts.challengerPolicy});
      return copy(cycle);
    }
    if (url.pathname === "/api/products") {
      const search = (url.searchParams.get("search") || "").toLowerCase();
      const category = url.searchParams.get("category") || "";
      return copy(data.products.filter((product) => (!category || product.category === category) && (!search || `${product.name} ${product.brand} ${product.sku}`.toLowerCase().includes(search))).slice(0,Number(url.searchParams.get("limit")) || 100));
    }
    if (url.pathname === "/api/outfit-prompts") {
      const search = (url.searchParams.get("search") || "").toLowerCase();
      return copy(data.prompts.filter((prompt) => !search || `${prompt.title} ${prompt.rawPrompt}`.toLowerCase().includes(search)).slice(0,Number(url.searchParams.get("limit")) || 200));
    }
    throw new Error(`Static publication does not implement ${url.pathname}.`);
  };
}
