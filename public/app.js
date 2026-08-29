import {
  escapeHtml,
  renderAgentCards,
  renderCycleHistory,
  renderCycleTimeline,
  renderMetricCards
} from "./autonomy-view.js";
import { createStaticApi } from "./static-runtime.js";

const state = { overview:null, cycles:[], products:[], prompts:[], staticMode:false };
const $ = (selector) => document.querySelector(selector);
const staticApi = createStaticApi();

const api = async (path, options = {}) => {
  try {
    const response = await fetch(path, {
      headers:{"content-type":"application/json",...(options.headers || {})},
      ...options
    });
    if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) throw new Error("Live API unavailable");
    return await response.json();
  } catch {
    state.staticMode = true;
    document.body.dataset.runtime = "published-static-simulation";
    return staticApi(path,options);
  }
};

function switchView(name) {
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("active",tab.dataset.view === name));
  document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active",view.id === `${name}-view`));
}

function renderWorldModel() {
  const world = state.overview.worldModel;
  const summary = [
    [world.catalogEntities,"CATALOG ENTITIES","Structured product observations"],
    [world.promptSeeds,"IMMUTABLE SEEDS","Outfits 053 through 252"],
    [world.progressionLevels,"TWIN STATES","Identity progression levels"]
  ];
  $("#world-model").innerHTML = summary.map(([value,label,detail]) => `<article><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span><small>${escapeHtml(detail)}</small></article>`).join("");

  $("#belief-list").innerHTML = world.beliefs.map((belief) => `<article class="belief-row" data-truth="${escapeHtml(belief.truthType)}">
    <i></i>
    <div><span>${escapeHtml(belief.scope)} / ${escapeHtml(belief.truthType)}</span><strong>${escapeHtml(belief.key).replaceAll("-"," ")}</strong><small>${escapeHtml(JSON.stringify(belief.value))}</small></div>
    <em>${Math.round(Number(belief.confidence) * 100)}%</em>
  </article>`).join("");

  if (world.activeGap) {
    $("#gap-card").className = "gap-card";
    $("#gap-card").innerHTML = `<span class="confidence">${Math.round(world.activeGap.confidence * 100)}% CONFIDENCE</span><h3>${escapeHtml(world.activeGap.label)}</h3><p>${escapeHtml(world.activeGap.rationale)}</p><div><span>CATEGORY</span><strong>${escapeHtml(world.activeGap.category)}</strong></div>`;
  }
}

function renderPolicy() {
  const policy = state.overview.activePolicy;
  if (!policy) {
    $("#active-policy").innerHTML = `<div class="empty-state">No active policy genome.</div>`;
    return;
  }
  $("#active-policy").innerHTML = `<div class="panel-head"><div><p class="eyebrow">ACTIVE CHAMPION</p><h2>${escapeHtml(policy.label)}</h2></div><span class="policy-version">v${escapeHtml(policy.version)}</span></div>
    <div class="utility-dial" style="--utility:${Math.round(policy.utilityEstimate * 100)}"><div><strong>${Math.round(policy.utilityEstimate * 100)}</strong><span>EXPECTED UTILITY</span></div></div>
    <div class="policy-config"><div><span>Exploration</span><strong>${Math.round(policy.configuration.explorationRate * 100)}%</strong></div><div><span>Novelty budget</span><strong>${Math.round(policy.configuration.noveltyBudget * 100)}%</strong></div><div><span>Provider</span><strong>${escapeHtml(policy.configuration.provider).toUpperCase()}</strong></div></div>
    <p class="lineage">${policy.parentId ? `Descends from ${escapeHtml(policy.parentId)}` : "Root constitutional policy genome"}</p>`;
}

function renderLatestCycle() {
  const cycle = state.overview.latestCycle;
  $("#cycle-timeline").innerHTML = renderCycleTimeline(cycle);
  if (!cycle) {
    $("#latest-decision").textContent = "AWAITING CYCLE";
    $("#counterfactual-grid").innerHTML = `<div class="empty-state">No counterfactual worlds yet.</div>`;
    $("#purchase-impact").className = "empty-state";
    $("#purchase-impact").textContent = "The simulator has not evaluated a candidate.";
    return;
  }

  $("#latest-decision").textContent = `${String(cycle.decision).toUpperCase()} · +${Number(cycle.utilityDelta).toFixed(2)}`;
  $("#constitution-signal").innerHTML = `<i></i><span>${cycle.constitution.passed ? "Constitution passed · zero side effects" : "Constitutional intervention required"}</span>`;
  $("#counterfactual-grid").innerHTML = cycle.artifacts.counterfactuals.map((candidate,index) => `<article class="counterfactual-card ${index === cycle.artifacts.counterfactuals.length - 1 ? "winner" : ""}">
    <div><span>WORLD ${String(index + 1).padStart(2,"0")}</span><strong>${Math.round(candidate.utility * 100)}</strong></div>
    <h3>${escapeHtml(candidate.variant).replaceAll("-"," ")}</h3>
    <p>${escapeHtml(candidate.intervention.baseLayer)}</p>
    <div class="utility-bar"><i style="width:${Math.round(candidate.utility * 100)}%"></i></div>
    <small>${index === cycle.artifacts.counterfactuals.length - 1 ? "SELECTED BY META-CONTROLLER" : "CONTROLLED COMPARISON"}</small>
  </article>`).join("");

  const impact = cycle.artifacts.purchaseImpact;
  $("#purchase-impact").className = "impact-grid";
  $("#purchase-impact").innerHTML = `<div class="impact-candidate"><span>SIMULATED CANDIDATE</span><h3>${escapeHtml(impact.candidate.label)}</h3><p>$${escapeHtml(impact.candidate.price)} · no cart created</p></div>
    <div><strong>+${escapeHtml(impact.newOutfitsUnlocked)}</strong><span>LOOKS UNLOCKED</span></div>
    <div><strong>+${escapeHtml(impact.existingLooksImproved)}</strong><span>LOOKS IMPROVED</span></div>
    <div><strong>$${Number(impact.costPerNewViableLook).toFixed(2)}</strong><span>COST / NEW LOOK</span></div>
    <div><strong>${escapeHtml(impact.progressionCompatibility).toUpperCase()}</strong><span>FUTURE FIT</span></div>`;
}

function renderAutonomy() {
  $("#branch-name").textContent = state.overview.branch;
  if (state.staticMode) {
    $("#runtime-label").textContent = "PUBLISHED DEMO · LOCAL SIMULATION";
    $("#cycle-status").textContent = "Published demonstration mode. Cycles persist only in this browser and cannot create external side effects.";
  }
  $("#autonomy-metrics").innerHTML = renderMetricCards(state.overview);
  $("#agent-grid").innerHTML = renderAgentCards(state.overview.agents);
  $("#cycle-history").innerHTML = renderCycleHistory(state.cycles);
  renderWorldModel();
  renderPolicy();
  renderLatestCycle();
}

function renderProducts() {
  $("#product-grid").innerHTML = state.products.map((product) => `<article class="product-card">
    <div class="product-top"><span class="sku">${escapeHtml(product.sku)}</span><span class="rarity">RARITY ${escapeHtml(product.rarity)}/10</span></div>
    <div class="entity-glyph" aria-hidden="true">${escapeHtml(product.category.slice(0,2).toUpperCase())}</div>
    <h3>${escapeHtml(product.name)}</h3>
    <div class="meta">${escapeHtml(product.category)} · ${escapeHtml(product.subcategory)}<br>${escapeHtml(product.brand)}</div>
    <div class="chips">${[...product.colors,...product.materials].slice(0,5).map((value) => `<span>${escapeHtml(value)}</span>`).join("")}</div>
  </article>`).join("");
}

function renderPrompts() {
  $("#prompt-list").innerHTML = state.prompts.map((prompt) => `<article class="prompt-card">
    <span class="prompt-number">${String(prompt.outfitId).padStart(3,"0")}</span>
    <div><h3>${escapeHtml(prompt.title)}</h3><p>${escapeHtml(prompt.rawPrompt)}</p></div>
    <span class="seed-lock">IMMUTABLE</span>
  </article>`).join("");
}

async function loadAutonomy() {
  [state.overview,state.cycles] = await Promise.all([
    api("/api/autonomy/overview"),
    api("/api/autonomy/cycles?limit=20")
  ]);
  renderAutonomy();
}

async function loadProducts() {
  state.products = await api(`/api/products?limit=100&search=${encodeURIComponent($("#product-search").value)}&category=${encodeURIComponent($("#category-filter").value)}`);
  renderProducts();
}

async function loadPrompts() {
  state.prompts = await api(`/api/outfit-prompts?limit=200&search=${encodeURIComponent($("#prompt-search").value)}`);
  renderPrompts();
}

async function runCycle() {
  const button = $("#run-cycle");
  const status = $("#cycle-status");
  button.disabled = true;
  button.classList.add("running");
  status.textContent = "Autonomous cycle running… the constitutional envelope remains active.";
  try {
    const cycle = await api("/api/autonomy/cycles/run", { method:"POST", body:JSON.stringify({trigger:"operator-observatory"}) });
    await loadAutonomy();
    status.textContent = `Cycle ${cycle.decision}. Expected utility delta ${cycle.utilityDelta >= 0 ? "+" : ""}${Number(cycle.utilityDelta).toFixed(2)}. External side effects: ${cycle.constitution.externalSideEffects}.`;
  } catch (error) {
    status.textContent = `Cycle stopped: ${error.message}`;
  } finally {
    button.disabled = false;
    button.classList.remove("running");
  }
}

document.querySelectorAll(".tab").forEach((tab) => tab.addEventListener("click",() => switchView(tab.dataset.view)));
$("#run-cycle").addEventListener("click",runCycle);
$("#product-search").addEventListener("input",loadProducts);
$("#category-filter").addEventListener("change",loadProducts);
$("#prompt-search").addEventListener("input",loadPrompts);

try {
  await Promise.all([loadAutonomy(),loadProducts(),loadPrompts()]);
} catch (error) {
  document.body.insertAdjacentHTML("afterbegin",`<div class="fatal-error" role="alert">${escapeHtml(error.message)}</div>`);
}
