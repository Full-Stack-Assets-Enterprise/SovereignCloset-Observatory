# Dual-Iteration Separation Contract

Status: Approved design contract  
Date: 2026-08-29  
Decision owner: Human Authority — Blaize  
Work item: `FIE-002`

## Decision

The Fashion Identity Ecosystem will continue as two independent product iterations:

- `iteration/bounded-auto-promotion`
- `iteration/fully-autonomous`

Both branches descend from the verified Fashion Identity Ecosystem MVP. They are hard forks, not runtime modes and not two configurations of one learning engine.

## Shared ancestor

The last shared product implementation is commit `107cd5d`, which contains:

- the fashion catalog proof application;
- 200 outfit prompts covering outfits 053–252;
- six identity-progression levels;
- the corrected identity canon;
- non-billable prompt-proof jobs; and
- the original automated verification suite.

The two architecture specifications and this contract may exist in both branches because they document the fork. No later product implementation is implicitly shared.

## Isolation requirements

Each iteration owns independent versions of:

- application code and public interface;
- database schema and migrations;
- catalog and Digital Twin state;
- agent definitions and orchestration;
- scanner configuration and source registry;
- scoring formulas and weights;
- experiment history and evaluation datasets;
- prompt variants and model routing;
- promotion, rollback, and audit machinery;
- tests, fixtures, analytics, documentation, and release receipts;
- deployment configuration and secrets; and
- ZzzOps policy, product goal, and executable goal DAG.

No branch reads the other branch's runtime database, learning state, experiment outcomes, credentials, or generated assets.

## Change-transfer rule

No merge, rebase, cherry-pick, shared package extraction, subtree import, automated synchronization, or copied learning artifact may cross between the branches unless Human Authority explicitly identifies the exact change and destination.

An explicitly approved transfer must retain:

1. original branch and commit;
2. rationale for transfer;
3. affected interfaces and data;
4. destination-specific tests;
5. identity-canon regression evidence; and
6. a receipt proving that branch-specific authority semantics did not change unintentionally.

## Canon shared by both iterations

The following identity requirements are immutable unless Human Authority changes them directly:

- preserve the same real adult identity without recasting, blending, averaging, demographic drift, or substitution;
- prohibit aging and age-progression imagery;
- use a terminal ear-jewelry goal of exactly 5 inches, using tunnels or filled plugs;
- use short dense black 360 waves; do not add blonde or red hair detailing unless Human Authority explicitly requests it for a specific output;
- retain all established tattoo designs and placements while coverage expands;
- retain the monumental legible `RARE ONE` back composition;
- retain the narrow sculpted beard, very thin mustache, eyebrow slit, rectangular black glasses, small nose piercing, and mandatory signature chain and pendant; and
- generate only separate standalone images, never collages or multi-panel compositions.

The fully autonomous iteration cannot rewrite, weaken, reinterpret, or experiment against this canon.

## Authority boundary

The branch name `fully-autonomous` describes internal product learning authority. It does not grant authority for:

- unapproved spending or financial transactions;
- production deployment or public release;
- external publishing or representational communication;
- credential, access-control, or security-policy changes;
- destructive or irreversible operations;
- legal commitments or rights assertions; or
- expansion of the system's own authority.

Those actions remain governed by Human Authority in both iterations.

## Visual distinction

Both products retain the Rare One black-luxury foundation, but their operating experiences intentionally diverge:

| Element | Bounded auto-promotion | Fully autonomous |
| --- | --- | --- |
| Primary metaphor | Control Room | Autonomy Observatory |
| User role | Governor and approver | Supervisor and intervener |
| Core interaction | Review promotion evidence | Observe and constrain live loops |
| Accent language | Crimson, warm metal, gate states | Violet, cold metal, live-system signals |
| Default surface | Promotion queue | Autonomous activity topology |
| Trust signal | Receipts and thresholds | Continuous telemetry and recovery |

## Completion criterion

The separation contract is satisfied when both branches exist from the same approved specification commit, each has an independent implementation plan, and branch-local tests prevent accidental policy or state convergence.
