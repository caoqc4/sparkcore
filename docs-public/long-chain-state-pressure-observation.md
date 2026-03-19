# Long-Chain State-Pressure Observation Guide

Use this guide when a real-chat acceptance run is already mostly stable at the rule layer, but you want to decide whether remaining decay is starting to look like long-chain thread-state pressure.

This is not a thread-compaction task.

Do not use this guide as permission to implement:

- `thread summary`
- `thread state packet`
- `thread compaction`
- new user-facing UI
- prompt-visible diagnostics

## What To Watch

Use this guide only when all of the following are true:

- the current run has no confirmed `P0` product drift from ordinary rule regressions
- the chain is long enough that continuity pressure could plausibly show up, using an `8 to 12 turn` observation window by default
- the observed weakening looks more like context carryover strain than a broken recall contract

This `8 to 12 turn` range is an acceptance observation window, not a hard product limit.

Useful developer-only clues:

- `recent_raw_turn_count`
- `approx_context_pressure`
- `same_thread_continuation_applicable`
- `long_chain_pressure_candidate`
- `first_detected_drift_turn`
- `drift_dimension`

## How To Read The Signals

- `recent_raw_turn_count`
  - approximate count of non-failed raw messages already carried by the thread at the current turn
- `approx_context_pressure`
  - lightweight bucket for how crowded the active thread context is becoming: `low`, `medium`, `elevated`, or `high`
- `same_thread_continuation_applicable`
  - whether the current turn is one where same-thread continuity should still be a meaningful carryover signal
- `long_chain_pressure_candidate`
  - a watch flag, not proof; it should only suggest that the current turn is long enough and continuity-heavy enough to justify closer attention

These signals must stay in `developer_diagnostics` and acceptance records only.

## Escalation Gate

Do not escalate to a real thread-state / compaction task unless the acceptance evidence starts showing this pattern:

1. runtime-rule checks are mostly stable across the current acceptance window
2. drift still begins repeatedly around longer same-thread chains
3. the repeated drift is better explained by long-chain continuity strain than by recall-contract failure
4. the same pattern survives at least one follow-up acceptance run instead of appearing only once

Use the following explicit trigger before opening a real Layer D design task:

- two consecutive real-chat regression runs show drift
- the drift appears in the same or a closely related scenario pack
- the drift dimension is the same or closely related across those runs
- `long_chain_pressure_candidate = true` on the relevant drift turn
- obvious rule-layer bugs have been ruled out first

This trigger is for entering Layer D design review, not for starting implementation immediately.

If the drift is still better explained by:

- wrong answer strategy selection
- wrong language routing
- missed relationship recall
- correction inconsistency

then keep it in the runtime-rule bucket and do not treat it as compaction evidence yet.

## Recording Template

Use this lightweight note when a long-chain candidate needs to be recorded during acceptance:

```txt
scenario_pack:
case_id:
first_detected_drift_turn:
drift_dimension:
main_developer_reason:
recent_raw_turn_count:
approx_context_pressure:
same_thread_continuation_applicable:
long_chain_pressure_candidate:
decision:
next_action:
```

Decision should be one of:

- `rule-layer drift`
- `watch only`
- `state-pressure candidate`

For the end-of-run acceptance summary, normalize the final wording to:

- `rule-layer issue`
- `state-pressure candidate`
- `no obvious drift`

And add one lightweight action field:

- `next_action = open_small_fix_issue` for `rule-layer issue`
- `next_action = prepare_layer_d_review` for `state-pressure candidate`
- `next_action = keep_role_layer` for `no obvious drift`

Minimum decision rule:

- keep `rule-layer issue` as the default whenever the evidence is still plausibly explained by an ordinary runtime-rule bug
- do not upgrade a single isolated drift into `state-pressure candidate`
- only treat the run as `state-pressure candidate` when similar evidence starts repeating across runs in the same or a closely related scenario pack and drift dimension

## Decision Rule

- choose `rule-layer drift` when the failure is still best explained by an existing routing, recall, or continuity rule gap
- choose `watch only` when the chain is getting longer and the signals are interesting, but the evidence is still too thin to justify a future compaction task
- choose `state-pressure candidate` only when the run shows repeated long-chain continuity strain that is no longer well explained by ordinary rule drift
