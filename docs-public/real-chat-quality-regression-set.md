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
   - the first turn where style, language, or structured recall starts to weaken, if it weakens at all
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

## Real Chat Cases

### 1. Same-agent nickname and preferred-name continuity survives a new thread and later short follow-ups

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

### 2. Remembered profession stays faithful across a longer direct-question chain

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

### 3. Replies follow the latest user message language across a longer mixed-language chain

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

### 4. Relationship style continuity remains visible from opening to closing turns in a longer chain

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

### 5. Incorrect and restore change later recall eligibility predictably after several turns

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
