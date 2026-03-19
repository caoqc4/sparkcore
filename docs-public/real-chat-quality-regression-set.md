# SparkCore Real Chat Quality Regression Set

Use this set when runtime instructions, answer fidelity, language handling, or relationship-style behavior changes and you want a fixed multi-turn baseline closer to real trial conversations.

This is intentionally lightweight. It is not a heavy evaluation platform. It is a repeatable regression set for the current `/chat` workspace, with each case written as a longer 5-to-8 turn path and with explicit decay checkpoints instead of a one-off spot check.

## How to Use It

1. Start from a known-good local or trial environment.
2. Re-run the same set after meaningful runtime, prompt, or profile changes.
3. Record:
   - the active agent
   - the model profile used
   - the final answer
   - the runtime summary outcome
   - whether the runtime summary still feels like a short user explanation instead of a developer diagnostics panel
   - the first turn where style, language, or structured recall starts to weaken, if it weakens at all
   - when a case fails, the scenario pack, failed turn, drift dimension, and one main developer-diagnostics reason
4. Compare against the same baseline before deciding whether quality improved.

To print the latest version of the regression set from source:

```bash
cd apps/web
npm run quality:eval -- --suite=real-chat
```

For machine-readable output:

```bash
cd apps/web
npm run quality:eval -- --suite=real-chat --format=json
```

## Failure Attribution Record

When a real-chat case fails, record the first failing turn with a lightweight note instead of only writing that the case drifted.

Required fields:

- `scenario_pack`
- `case_id`
- `failed_turn`
- `drift_dimension`
- `main_developer_reason`

Supported drift dimensions:

- `fidelity`
- `language`
- `relationship-continuity`
- `correction-consistency`

Suggested developer reason clues:

- `answer_strategy_reason_code`
- `continuation_reason_code`
- `reply_language_source`
- `memory_used / recalled_memories`

Recording notes:

- record the first turn where drift becomes visible, not only the final broken turn
- use the smallest single drift dimension that best explains the failure
- keep the developer reason lightweight: capture the one clue that best explains the failing turn instead of dumping the whole metadata object

## Acceptance Thresholds

Use the following lightweight thresholds for the next acceptance pass:

Pass:

- all `P0` cases pass without a recorded failing turn
- no case needs a drift-dimension note because no material drift appears
- the default explanation layer still stays lightweight and user-facing

Acceptable minor drift:

- one `P1`-only case shows a minor drift, but the run still has no `P0` failure
- the drift is isolated to one turn, recovers within the same case, and does not break the case's main contract
- the run still records the first failing turn, drift dimension, and one main developer reason so the drift can be watched later

Must-open-issue:

- any `P0` case records a failing turn
- any drift clearly breaks the main contract of `fidelity`, `language`, `relationship-continuity`, or `correction-consistency` for that case
- the same drift dimension appears across more than one case or scenario pack in the same run
- a previously minor drift repeats across runs instead of remaining isolated

Decision notes:

- do not turn minor wording preference differences into failures unless they clearly break a case's main contract
- decide severity from the first failing turn and drift dimension before debating root causes
- if a run lands in the acceptable-minor-drift bucket, finish the run, record it, and only then decide whether to open a follow-up issue

## Long-Chain State-Pressure Watch

Do not treat this as permission to build thread compaction, thread summary, or a state packet yet.

Use the long-chain watch only when the current runtime rules already look mostly stable and you want to decide whether later drift is starting to look like thread-state pressure instead of another rule-layer gap.

During the default `8 to 12 turn` acceptance observation window, record these developer-only signals when they help explain a drift:

- `recent_raw_turn_count`
- `approx_context_pressure`
- `same_thread_continuation_applicable`
- `long_chain_pressure_candidate`

Use the dedicated observation guide for the escalation gate and recording template:

- `docs-public/long-chain-state-pressure-observation.md`

This window is for acceptance consistency, not a claim that shorter or longer threads cannot matter.

## Scenario Packs

This set is grouped into lightweight scenario packs so longer regression runs are easier to assign, compare, and extend without turning into one flat list.

- `Relationship Maintenance Pack`: checks same-agent continuity, nickname/preferred-name carryover, and relationship-style stability over longer same-thread or new-thread chains.
- `Memory Confirmation Pack`: checks whether remembered facts still answer direct confirmation questions after several turns instead of fading into vague wording.
- `Mixed-Language Pack`: checks whether short ambiguous follow-ups keep obeying the latest user-language signal instead of drifting back to earlier context.
- `Correction Aftermath Pack`: checks whether `Incorrect` and `Restore` keep affecting later turns consistently instead of only changing row status in the panel.

## Real Chat Cases

## Relationship Maintenance Pack

### 1. Same-agent nickname and preferred-name continuity survives a new thread and later short follow-ups

- Scenario pack: `Relationship Maintenance Pack`

- Priority: `P0`
- Category: `thread`
- Purpose: verify that relationship continuity survives a new thread with the same agent and keeps showing up after short follow-up turns

Steps:

1. Say: `以后我叫你小芳可以吗？`
2. Then say: `以后你叫我阿强可以吗？`
3. Start a fresh thread with the same agent
4. Turn 1: ask `请简单介绍一下你自己。`
5. Turn 2: send `那接下来呢？`
6. Turn 3: ask `那你接下来会怎么称呼我？`
7. Turn 4: send `好，继续。`
8. Turn 5: ask `最后再简单介绍一下你自己。`

Success criteria:

- the new thread still uses the nickname and preferred user name
- the later short follow-ups still keep the same relationship cues
- runtime summary still reports relationship memory usage
- you can identify the first decay turn if nickname or preferred-name continuity starts weakening

Failure conditions:

- count it as failed at the first turn where the nickname disappears once even though the same agent and relationship memory should still be active
- count it as failed at the first turn where the preferred user name disappears once even though the same agent and relationship memory should still be active
- count it as failed if relationship memory should still apply but the runtime summary no longer shows relationship memory usage

### 2. Relationship style continuity remains visible from opening to closing turns in a longer chain

- Scenario pack: `Relationship Maintenance Pack`
- Priority: `P0`
- Category: `fidelity`
- Purpose: verify that relationship style is not only remembered but also performed from the opening turn through mid-thread and closing-style follow-ups

Steps:

1. Seed: `以后和我说话轻松一点，可以吗？`
2. Turn 1: ask `请简单介绍一下你自己。`
3. Turn 2: ask `接下来你会怎么帮助我？`
4. Turn 3: ask `如果我今天状态不太好，你会怎么和我说？`
5. Turn 4: ask `最后你会怎么陪我把事情推进下去？`
6. Turn 5: ask `那你再简单鼓励我一句。`

Success criteria:

- the tone remains lightweight and consistent across all replies
- same-thread continuity wins over distant defaults
- you can identify the first turn where the relationship style noticeably flattens, if it flattens

Failure conditions:

- count it as failed at the first turn where the relationship tone clearly drops back to the default neutral style instead of keeping the seeded relationship style
- count it as failed if opening, explanatory, or closing turns stop reflecting the same-thread relationship style while the relationship memory is still active
- count it as failed if the answer still sounds correct in content but no longer performs the expected relationship cues

### 3. Default explanation UI stays short even when runtime diagnostics become richer

- Scenario pack: `Relationship Maintenance Pack`
- Priority: `P1`
- Category: `explanation`
- Purpose: verify that the explanation surface shown to normal users stays focused on one main reason and brief outcomes instead of turning into an engineering diagnostics panel as runtime metadata grows

Steps:

1. Open the runtime summary under the latest assistant reply.
2. Check the summary headline and the first explanation sentence.
3. Scan the visible summary body for developer-only wording such as `answer strategy`, `same-thread continuation`, or raw language-detection labels.

Success criteria:

- the toggle and headline still read like a short user-facing explanation
- the expanded summary keeps one main reason in the first layer instead of stacking multiple primary explanations
- developer-only diagnostics stay absent from the default visible summary surface

Failure conditions:

- count it as failed if the default explanation grows into multiple top-level reason paragraphs instead of one main reason
- count it as failed if developer-only labels such as `answer strategy`, `same-thread continuation`, or raw language-detection fields appear in the default visible summary
- count it as failed if the explanation copy becomes noticeably longer or more technical than a short user-facing note

## Memory Confirmation Pack

### 4. Remembered profession stays faithful across a longer direct-question chain

- Scenario pack: `Memory Confirmation Pack`

- Priority: `P0`
- Category: `fidelity`
- Purpose: verify that a recalled profession is stated directly across more than one direct question instead of being blurred or contradicted

Steps:

1. Send: `I am a product designer.`
2. Start a fresh thread
3. Turn 1: ask `What profession do you remember that I work in? If you do not know, say you do not know.`
4. Turn 2: ask `So what kind of work do I do?`
5. Turn 3: ask `Say it again in one short sentence.`
6. Turn 4: ask `What do you remember about my work?`

Success criteria:

- the later direct replies explicitly say `product designer`
- the replies do not confuse “no chat history” with “no long-term memory”
- you can identify the first turn where structured profession recall weakens, if it weakens

Failure conditions:

- count it as failed at the first turn where a reply no longer says `product designer` or an equivalent explicit profession even though the relevant memory should still be available
- count it as failed if the runtime summary still shows a relevant memory hit but the answer does not reflect the remembered profession
- count it as failed if the answer falls back to “I do not know” or generic help text while the profession memory should still be recallable

## Mixed-Language Pack

### 5. Replies follow the latest user message language across a longer mixed-language chain

- Scenario pack: `Mixed-Language Pack`

- Priority: `P0`
- Category: `language`
- Purpose: verify that the latest user turn has the highest language priority across a short multi-turn sequence

Steps:

1. Turn 1: send an English message such as: `Please introduce yourself briefly.`
2. Turn 2: send a Chinese message such as: `你记得我做什么工作吗？`
3. Turn 3: send `那接下来呢？`
4. Turn 4: send `再用一句话说一遍。`
5. Turn 5: send `ok, now continue in Chinese.`
6. Expand the runtime summary on the later replies

Success criteria:

- the later Chinese turns receive Chinese replies
- the short same-thread follow-ups also stay in Chinese
- earlier English turns or recalled English memory do not pull the answer back to English
- you can identify the first turn where language drift appears, if it appears

Failure conditions:

- count it as failed at the first turn where a Chinese user message receives a primarily English reply without an explicit language-switch instruction
- count it as failed if a short same-thread Chinese follow-up snaps back to English because of earlier English turns or recalled English memory
- count it as failed if the reply language follows distant thread history more strongly than the current user's latest message

## Correction Aftermath Pack

### 6. Incorrect and restore change later recall eligibility predictably after several turns

- Scenario pack: `Correction Aftermath Pack`

- Priority: `P0`
- Category: `correction`
- Purpose: verify that correction controls affect later real-chat behavior across more than one reply, not just isolated memory rows

Steps:

1. Mark a nickname or profession memory as `Incorrect`
2. Start a fresh thread and ask the same direct question again
3. Turn 2: ask `那你现在还记得吗？`
4. Turn 3: ask `再确认一次？`
5. Restore the memory
6. Start another fresh thread and ask the same question again
7. Turn 5: ask `那你现在还记得吗？`
8. Turn 6: ask `再确认一次？`

Success criteria:

- `Incorrect` removes the memory from later recall
- `Restore` returns the same memory to later recall
- the correction result stays stable across more than one reply
- you can identify the first turn where correction behavior becomes inconsistent, if it becomes inconsistent

Failure conditions:

- count it as failed if `Incorrect` is applied but any later turn still uses the removed memory as if it were active
- count it as failed if `Restore` is applied but any later turn still behaves as if the memory were unavailable
- count it as failed at the first turn where correction behavior flips back and forth across short follow-ups instead of staying stable
