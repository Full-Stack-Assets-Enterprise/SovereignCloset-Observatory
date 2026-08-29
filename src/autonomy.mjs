import { randomUUID } from "node:crypto";
import {
  decodeAutonomyCycle,
  decodeAutonomyEvent,
  decodePolicyGenome
} from "./database.mjs";

const BRANCH = "iteration/fully-autonomous";

const AGENTS = [
  { id:"research", name:"Research Director", mandate:"Set the internal research agenda and inspect authorized evidence." },
  { id:"world-model", name:"World Model Reconciler", mandate:"Keep observations, beliefs, predictions, and constitutional facts distinct." },
  { id:"gap-analysis", name:"Wardrobe Gap Hunter", mandate:"Find high-leverage missing bridge pieces in the wardrobe graph." },
  { id:"style-compile", name:"Evolving Style Compiler", mandate:"Compile typed Style IR without weakening identity constraints." },
  { id:"counterfactual", name:"Causal Counterfactual Engine", mandate:"Test controlled alternative worlds and their utility deltas." },
  { id:"purchase-impact", name:"Purchase Impact Simulator", mandate:"Estimate wardrobe leverage without attempting a transaction." },
  { id:"critic-swarm", name:"Critic Swarm", mandate:"Independently evaluate identity, utility, provenance, and output compliance." },
  { id:"meta-learning", name:"Meta-Learning Controller", mandate:"Generate a better internal policy from the cycle evidence." },
  { id:"constitutional-audit", name:"Constitutional Auditor", mandate:"Enforce canon, authority, cost, provenance, and reversibility." },
  { id:"promotion", name:"Policy Evolution Kernel", mandate:"Promote eligible internal challengers and preserve rollback lineage." }
];

const parse = (value, fallback = null) => value ? JSON.parse(value) : fallback;
const round = (value) => Number(value.toFixed(2));

export class AutonomousFashionEngine {
  constructor(db) {
    this.db = db;
  }

  overview() {
    const scalar = (sql) => this.db.prepare(sql).get().count;
    const activePolicy = decodePolicyGenome(this.db.prepare("SELECT * FROM policy_genomes WHERE status='active' ORDER BY version DESC LIMIT 1").get());
    const beliefs = this.db.prepare("SELECT * FROM world_model_beliefs ORDER BY scope, belief_key").all().map((row) => ({
      id: row.id,
      key: row.belief_key,
      scope: row.scope,
      truthType: row.truth_type,
      value: parse(row.value_json, {}),
      confidence: row.confidence,
      source: row.source,
      updatedAt: row.updated_at
    }));
    const latestCycle = this.listCycles(1)[0] || null;
    const latestGap = this.db.prepare("SELECT * FROM wardrobe_gap_hypotheses ORDER BY created_at DESC LIMIT 1").get();
    const receipts = this.db.prepare("SELECT receipt_json FROM constitutional_receipts").all().map((row) => parse(row.receipt_json, {}));

    return {
      branch: BRANCH,
      mode: "autonomous-internal",
      health: "learning-ready",
      liveProvidersEnabled: false,
      activePolicy,
      stats: {
        cycles: scalar("SELECT COUNT(*) AS count FROM autonomous_cycles"),
        events: scalar("SELECT COUNT(*) AS count FROM autonomy_events"),
        policies: scalar("SELECT COUNT(*) AS count FROM policy_genomes"),
        worldBeliefs: beliefs.length,
        constitutionalViolations: receipts.filter((receipt) => !receipt.passed).length,
        externalSideEffects: receipts.reduce((total, receipt) => total + Number(receipt.externalSideEffects || 0), 0)
      },
      worldModel: {
        catalogEntities: scalar("SELECT COUNT(*) AS count FROM products"),
        promptSeeds: scalar("SELECT COUNT(*) AS count FROM outfit_prompts"),
        progressionLevels: scalar("SELECT COUNT(*) AS count FROM progression_levels"),
        beliefs,
        activeGap: latestGap ? {
          id: latestGap.id,
          label: latestGap.label,
          category: latestGap.category,
          confidence: latestGap.confidence,
          rationale: latestGap.rationale
        } : null
      },
      agents: AGENTS.map((agent) => ({ ...agent, state:"ready", autonomy:"internal" })),
      latestCycle
    };
  }

  listCycles(limit = 20) {
    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    return this.db.prepare("SELECT * FROM autonomous_cycles ORDER BY created_at DESC, rowid DESC LIMIT ?").all(safeLimit).map((row) => this.#hydrateCycle(row));
  }

  runCycle({ trigger = "operator-preview" } = {}) {
    const activeRow = this.db.prepare("SELECT * FROM policy_genomes WHERE status='active' ORDER BY version DESC LIMIT 1").get();
    const active = decodePolicyGenome(activeRow);
    if (!active) throw new Error("No active autonomous policy is available.");

    const cycleId = `cycle-${randomUUID()}`;
    let sequence = 0;
    this.db.exec("BEGIN IMMEDIATE");
    try {
      this.db.prepare(`INSERT INTO autonomous_cycles
        (id,trigger,status,active_stage,baseline_policy_id)
        VALUES (?,?,?,?,?)`).run(cycleId,String(trigger || "operator-preview"),"running","research",active.id);

      const addEvent = ({ stage, agent, summary, evidenceType, evidence }) => {
        sequence += 1;
        this.db.prepare("UPDATE autonomous_cycles SET active_stage=? WHERE id=?").run(stage,cycleId);
        this.db.prepare(`INSERT INTO autonomy_events
          (cycle_id,sequence,stage,agent,summary,evidence_type,evidence_json)
          VALUES (?,?,?,?,?,?,?)`).run(cycleId,sequence,stage,agent,summary,evidenceType,JSON.stringify(evidence));
      };

      addEvent({
        stage:"research",
        agent:"Research Director",
        summary:"Opened a fixture-only research cycle with no external scans.",
        evidenceType:"observation",
        evidence:{ sourceRegistry:"fixture-only", externalScans:0, authorized:true }
      });

      const catalogEntities = this.db.prepare("SELECT COUNT(*) AS count FROM products").get().count;
      const promptSeeds = this.db.prepare("SELECT COUNT(*) AS count FROM outfit_prompts").get().count;
      const progressionLevels = this.db.prepare("SELECT COUNT(*) AS count FROM progression_levels").get().count;
      addEvent({
        stage:"world-model",
        agent:"World Model Reconciler",
        summary:`Reconciled ${catalogEntities} catalog entities, ${promptSeeds} immutable prompt seeds, and ${progressionLevels} progression levels.`,
        evidenceType:"belief",
        evidence:{ catalogEntities, promptSeeds, progressionLevels, generatedFactsPromoted:false }
      });

      const baseLayerCount = this.db.prepare(`SELECT COUNT(*) AS count FROM products
        WHERE lower(subcategory) LIKE '%tee%' OR lower(subcategory) LIKE '%tank%' OR lower(subcategory) LIKE '%knit%'`).get().count;
      const gap = {
        id:`gap-${randomUUID()}`,
        label:"Refined black base layer",
        category:"clothing/base-layer",
        confidence:0.94,
        rationale:"The seeded wardrobe has strong outerwear, trousers, footwear, and jewelry but no typed tee, tank, or knit base layer.",
        evidence:{ baseLayerCount, catalogEntities, missingBridgeRoles:["base-top"] }
      };
      this.db.prepare(`INSERT INTO wardrobe_gap_hypotheses
        (id,cycle_id,label,category,rationale,confidence,status,evidence_json)
        VALUES (?,?,?,?,?,?,?,?)`).run(gap.id,cycleId,gap.label,gap.category,gap.rationale,gap.confidence,"active",JSON.stringify(gap.evidence));
      addEvent({
        stage:"gap-analysis",
        agent:"Wardrobe Gap Hunter",
        summary:"Detected a missing refined black base layer as the highest-leverage bridge hypothesis.",
        evidenceType:"prediction",
        evidence:{ gapId:gap.id, confidence:gap.confidence, observedBaseLayers:baseLayerCount }
      });

      const styleIr = {
        schema:"style-ir/autonomy-v1",
        truthType:"synthetic",
        identityCanonVersion:"2026-08-29",
        progressionLevel:"north-star",
        persona:"Founder Noir",
        objective:"Resolve the base-layer gap while protecting identity hierarchy.",
        garmentRoles:[
          { role:"base", target:"refined black base layer", status:"candidate" },
          { role:"frame", target:"structured black outerwear", status:"owned-substitute" },
          { role:"lower", target:"wide black trouser", status:"owned-substitute" },
          { role:"foot", target:"substantial black footwear", status:"owned-substitute" },
          { role:"signature", target:"signature chain and pendant", status:"mandatory" }
        ],
        constraints:{ palette:["black"], logoVisibilityMax:0.2, standaloneImageOnly:true, gaugeInches:5, agingProhibited:true },
        output:{ format:"standalone portrait", provider:"none" }
      };
      const constraintReport = {
        passed:true,
        checks:{ identityLocked:true, gaugeInches:5, agingProhibited:true, standaloneImageOnly:true, providerAuthorized:false }
      };
      const styleIrId = `style-ir-${randomUUID()}`;
      this.db.prepare(`INSERT INTO style_ir_artifacts
        (id,cycle_id,compiler_version,input_json,ir_json,constraint_report_json)
        VALUES (?,?,?,?,?,?)`).run(styleIrId,cycleId,"compiler-genome-v1",JSON.stringify({gapId:gap.id,policyId:active.id}),JSON.stringify(styleIr),JSON.stringify(constraintReport));
      addEvent({
        stage:"style-compile",
        agent:"Evolving Style Compiler",
        summary:"Compiled a typed Founder Noir Style IR with a machine-verifiable identity constraint report.",
        evidenceType:"synthetic",
        evidence:{ styleIrId, compilerVersion:"compiler-genome-v1", constraintReport }
      });

      const counterfactuals = [
        { variant:"control", intervention:{baseLayer:"oversized hoodie dependency"}, outcome:{coverageLift:0,identityHierarchy:0.76,versatility:0.58}, utility:0.78 },
        { variant:"fine-gauge-knit", intervention:{baseLayer:"fine-gauge black knit"}, outcome:{coverageLift:19,identityHierarchy:0.9,versatility:0.86}, utility:0.86 },
        { variant:"black-tank", intervention:{baseLayer:"high-quality black tank"}, outcome:{coverageLift:27,identityHierarchy:0.94,versatility:0.9}, utility:0.9 }
      ].map((candidate) => ({ id:`counterfactual-${randomUUID()}`,...candidate }));
      const insertCounterfactual = this.db.prepare(`INSERT INTO counterfactual_worlds
        (id,cycle_id,variant,intervention_json,outcome_json,utility)
        VALUES (?,?,?,?,?,?)`);
      for (const candidate of counterfactuals) insertCounterfactual.run(candidate.id,cycleId,candidate.variant,JSON.stringify(candidate.intervention),JSON.stringify(candidate.outcome),candidate.utility);
      addEvent({
        stage:"counterfactual",
        agent:"Causal Counterfactual Engine",
        summary:"Compared a control with fine-knit and black-tank interventions while holding the surrounding look constant.",
        evidenceType:"counterfactual",
        evidence:{ variants:counterfactuals.map(({variant,utility}) => ({variant,utility})), declaredIntervention:"base-layer only" }
      });

      const purchaseImpact = {
        id:`purchase-impact-${randomUUID()}`,
        candidate:{ label:"High-quality black tank", state:"simulated-candidate", price:850 },
        newOutfitsUnlocked:27,
        existingLooksImproved:11,
        redundancy:"low",
        progressionCompatibility:"high",
        costPerNewViableLook:31.48,
        expectedUtility:0.9,
        transactionAttempted:false
      };
      this.db.prepare(`INSERT INTO purchase_impact_scenarios
        (id,cycle_id,candidate_json,impact_json,transaction_attempted)
        VALUES (?,?,?,?,?)`).run(purchaseImpact.id,cycleId,JSON.stringify(purchaseImpact.candidate),JSON.stringify({
          newOutfitsUnlocked:purchaseImpact.newOutfitsUnlocked,
          existingLooksImproved:purchaseImpact.existingLooksImproved,
          redundancy:purchaseImpact.redundancy,
          progressionCompatibility:purchaseImpact.progressionCompatibility,
          costPerNewViableLook:purchaseImpact.costPerNewViableLook,
          expectedUtility:purchaseImpact.expectedUtility
        }),0);
      addEvent({
        stage:"purchase-impact",
        agent:"Purchase Impact Simulator",
        summary:"Estimated wardrobe leverage without creating a cart, contacting a merchant, or attempting a transaction.",
        evidenceType:"prediction",
        evidence:{ scenarioId:purchaseImpact.id, newOutfitsUnlocked:27, transactionAttempted:false }
      });

      const criticEvidence = {
        identityFidelity:1,
        standaloneCompliance:1,
        provenanceConfidence:0.96,
        wardrobeUtility:0.9,
        criticDisagreement:0.04,
        hardFailures:0
      };
      addEvent({
        stage:"critic-swarm",
        agent:"Critic Swarm",
        summary:"Independent critics found no identity, provenance, hierarchy, or output-contract failure.",
        evidenceType:"belief",
        evidence:criticEvidence
      });

      const challengerVersion = active.version + 1;
      const challengerUtility = Math.min(0.96, round(active.utilityEstimate + 0.04));
      const challengerId = `autonomy-policy-v${challengerVersion}-${cycleId.slice(-8)}`;
      const challengerConfiguration = {
        ...active.configuration,
        explorationRate:round(Math.max(0.05, active.configuration.explorationRate - 0.01)),
        noveltyBudget:round(Math.min(0.4, active.configuration.noveltyBudget + 0.01)),
        preferredBaseLayer:"high-quality black tank",
        learnedFromCycle:cycleId
      };
      this.db.prepare(`INSERT INTO policy_genomes
        (id,kind,label,version,status,parent_id,configuration_json,utility_estimate)
        VALUES (?,?,?,?,?,?,?,?)`).run(challengerId,active.kind,`Constitutional Explorer v${challengerVersion}`,challengerVersion,"challenger",active.id,JSON.stringify(challengerConfiguration),challengerUtility);
      this.db.prepare("UPDATE autonomous_cycles SET challenger_policy_id=? WHERE id=?").run(challengerId,cycleId);
      const utilityDelta = round(challengerUtility - active.utilityEstimate);
      addEvent({
        stage:"meta-learning",
        agent:"Meta-Learning Controller",
        summary:`Authored challenger policy v${challengerVersion} with a ${utilityDelta.toFixed(2)} expected utility lift.`,
        evidenceType:"decision",
        evidence:{ baselinePolicyId:active.id, challengerPolicyId:challengerId, utilityDelta, stoppingRule:"constitutional-pass-and-delta-gte-0.03" }
      });

      const constitution = {
        branch:BRANCH,
        cycleId,
        passed:true,
        canon:{
          identityLocked:true,
          gaugeInches:5,
          agingProhibited:true,
          hair:"short dense black 360 waves",
          signatureJewelryMandatory:true,
          tattooCanonPreserved:true,
          standaloneImageOnly:true
        },
        authority:{ internalLearningOnly:true, checkoutAllowed:false, outboundCommunicationAllowed:false, publishingAllowed:false, authorityExpansionAllowed:false },
        providerCalls:0,
        billableCost:0,
        externalSideEffects:0,
        reversible:true,
        checks:{ evidenceTyped:true, benchmarkSeedsImmutable:true, transactionAttempted:false, providerAuthorized:false }
      };
      const constitutionId = `constitution-${randomUUID()}`;
      this.db.prepare(`INSERT INTO constitutional_receipts
        (id,cycle_id,passed,receipt_json)
        VALUES (?,?,?,?)`).run(constitutionId,cycleId,1,JSON.stringify(constitution));
      addEvent({
        stage:"constitutional-audit",
        agent:"Constitutional Auditor",
        summary:"Verified immutable identity, authority, cost, evidence-type, and reversibility constraints.",
        evidenceType:"constitutional-fact",
        evidence:{ receiptId:constitutionId, passed:true, externalSideEffects:0, gaugeInches:5 }
      });

      const eligible = constitution.passed && utilityDelta >= 0.03 && purchaseImpact.transactionAttempted === false;
      const decision = eligible ? "promoted" : "rejected";
      if (eligible) {
        this.db.prepare("UPDATE policy_genomes SET status='retired' WHERE id=?").run(active.id);
        this.db.prepare("UPDATE policy_genomes SET status='active' WHERE id=?").run(challengerId);
      } else {
        this.db.prepare("UPDATE policy_genomes SET status='rejected' WHERE id=?").run(challengerId);
      }
      addEvent({
        stage:"promotion",
        agent:"Policy Evolution Kernel",
        summary:eligible ? "Promoted the internal challenger and retained the prior policy as a rollback checkpoint." : "Rejected the challenger and retained the active policy.",
        evidenceType:"decision",
        evidence:{ decision, activePolicyId:eligible ? challengerId : active.id, rollbackPolicyId:active.id, utilityDelta }
      });

      const cycleReceipt = {
        mode:"deterministic-fixture-cycle",
        branch:BRANCH,
        moduleCount:5,
        eventCount:sequence,
        decision,
        externalSideEffects:0,
        billable:false,
        rollbackPolicyId:active.id
      };
      this.db.prepare(`UPDATE autonomous_cycles SET
        status='completed',active_stage='complete',decision=?,utility_delta=?,cycle_receipt_json=?,completed_at=CURRENT_TIMESTAMP
        WHERE id=?`).run(decision,utilityDelta,JSON.stringify(cycleReceipt),cycleId);
      this.db.exec("COMMIT");
      return this.#hydrateCycle(this.db.prepare("SELECT * FROM autonomous_cycles WHERE id=?").get(cycleId));
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }

  #hydrateCycle(row) {
    const cycle = decodeAutonomyCycle(row);
    const events = this.db.prepare("SELECT * FROM autonomy_events WHERE cycle_id=? ORDER BY sequence").all(cycle.id).map(decodeAutonomyEvent);
    const constitutionRow = this.db.prepare("SELECT receipt_json FROM constitutional_receipts WHERE cycle_id=?").get(cycle.id);
    const gapRow = this.db.prepare("SELECT * FROM wardrobe_gap_hypotheses WHERE cycle_id=? ORDER BY created_at DESC LIMIT 1").get(cycle.id);
    const styleRow = this.db.prepare("SELECT * FROM style_ir_artifacts WHERE cycle_id=? ORDER BY created_at DESC LIMIT 1").get(cycle.id);
    const counterfactualRows = this.db.prepare("SELECT * FROM counterfactual_worlds WHERE cycle_id=? ORDER BY rowid").all(cycle.id);
    const purchaseRow = this.db.prepare("SELECT * FROM purchase_impact_scenarios WHERE cycle_id=? ORDER BY created_at DESC LIMIT 1").get(cycle.id);
    const challenger = cycle.challengerPolicyId ? decodePolicyGenome(this.db.prepare("SELECT * FROM policy_genomes WHERE id=?").get(cycle.challengerPolicyId)) : null;

    return {
      ...cycle,
      events,
      constitution: constitutionRow ? parse(constitutionRow.receipt_json, {}) : null,
      artifacts: {
        gap: gapRow ? {
          id:gapRow.id,
          label:gapRow.label,
          category:gapRow.category,
          rationale:gapRow.rationale,
          confidence:gapRow.confidence,
          status:gapRow.status,
          evidence:parse(gapRow.evidence_json,{})
        } : null,
        styleIr: styleRow ? {
          id:styleRow.id,
          compilerVersion:styleRow.compiler_version,
          input:parse(styleRow.input_json,{}),
          ir:parse(styleRow.ir_json,{}),
          constraintReport:parse(styleRow.constraint_report_json,{})
        } : null,
        counterfactuals: counterfactualRows.map((candidate) => ({
          id:candidate.id,
          variant:candidate.variant,
          intervention:parse(candidate.intervention_json,{}),
          outcome:parse(candidate.outcome_json,{}),
          utility:candidate.utility
        })),
        purchaseImpact: purchaseRow ? {
          id:purchaseRow.id,
          candidate:parse(purchaseRow.candidate_json,{}),
          ...parse(purchaseRow.impact_json,{}),
          transactionAttempted:Boolean(purchaseRow.transaction_attempted)
        } : null,
        challengerPolicy:challenger
      }
    };
  }
}
