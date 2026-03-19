# SparkCore Real Chat Quality Regression Set

Use this set when runtime instructions, answer fidelity, language handling, or relationship-style behavior changes and you want a fixed multi-turn baseline closer to real trial conversations.

This is intentionally lightweight. It is not a heavy evaluation platform. It is a repeatable regression set for the current `/chat` workspace, with each case written as a short 3-to-5 turn path instead of a one-off spot check.

## How to Use It

1. Start from a known-good local or trial environment.
2. Re-run the same set after meaningful runtime, prompt, or profile changes.
3. Record:
   - the active agent
   - the model profile used
   - the final answer
   - the runtime summary outcome
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

### 1. Same-agent nickname and preferred-name continuity survives a new thread and follow-up turns

- Priority: `P0`
- Category: `thread`
- Purpose: verify that relationship continuity survives a new thread with the same agent and keeps showing up after short follow-up turns

Steps:

1. Say: `以后我叫你小芳可以吗？`
2. Then say: `以后你叫我阿强可以吗？`
3. Start a fresh thread with the same agent
4. Ask: `请简单介绍一下你自己。`
5. Then send: `那接下来呢？`

Success criteria:

- the new thread still uses the nickname and preferred user name
- the short follow-up still keeps the same relationship cues
- runtime summary still reports relationship memory usage

### 2. Remembered profession stays faithful across a short direct-question chain

- Priority: `P0`
- Category: `fidelity`
- Purpose: verify that a recalled profession is stated directly across more than one direct question instead of being blurred or contradicted

Steps:

1. Send: `I am a product designer.`
2. Start a fresh thread
3. Ask: `What profession do you remember that I work in? If you do not know, say you do not know.`
4. Then ask: `So what kind of work do I do?`

Success criteria:

- both direct replies explicitly say `product designer`
- the replies do not confuse “no chat history” with “no long-term memory”

### 3. Replies follow the latest user message language across multiple turns

- Priority: `P0`
- Category: `language`
- Purpose: verify that the latest user turn has the highest language priority across a short multi-turn sequence

Steps:

1. Send an English message such as: `Please introduce yourself briefly.`
2. Then send a Chinese message such as: `你记得我做什么工作吗？`
3. Then send: `那接下来呢？`
4. Expand the runtime summary on the later replies

Success criteria:

- the later Chinese turn receives a Chinese reply
- the short same-thread follow-up also stays in Chinese
- earlier English turns or recalled English memory do not pull the answer back to English

### 4. Relationship style continuity remains visible from opening to closing turns

- Priority: `P0`
- Category: `fidelity`
- Purpose: verify that relationship style is not only remembered but also performed from the opening turn through mid-thread and closing-style follow-ups

Steps:

1. Seed: `以后和我说话轻松一点，可以吗？`
2. Ask: `请简单介绍一下你自己。`
3. Then ask: `接下来你会怎么帮助我？`
4. Then ask: `最后你会怎么陪我把事情推进下去？`

Success criteria:

- the tone remains lightweight and consistent across all replies
- same-thread continuity wins over distant defaults

### 5. Incorrect and restore change later recall eligibility predictably after several turns

- Priority: `P0`
- Category: `correction`
- Purpose: verify that correction controls affect later real-chat behavior across more than one reply, not just isolated memory rows

Steps:

1. Mark a nickname or profession memory as `Incorrect`
2. Start a fresh thread and ask the same direct question again
3. Then ask: `那你现在还记得吗？`
4. Restore the memory
5. Start another fresh thread and ask the same question again
6. Then ask: `那你现在还记得吗？`

Success criteria:

- `Incorrect` removes the memory from later recall
- `Restore` returns the same memory to later recall
- the correction result stays stable across more than one reply
