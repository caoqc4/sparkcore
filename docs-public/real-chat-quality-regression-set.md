# SparkCore Real Chat Quality Regression Set

Use this set when runtime instructions, answer fidelity, language handling, or relationship-style behavior changes and you want a fixed baseline closer to real trial conversations.

This is intentionally lightweight. It is not a heavy evaluation platform. It is a repeatable regression set for the current `/chat` workspace.

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

### 1. Same-agent nickname and preferred-name continuity survives a new thread

- Priority: `P0`
- Category: `thread`
- Purpose: verify that relationship continuity survives a new thread with the same agent, instead of only working inside one old thread

Steps:

1. Say: `以后我叫你小芳可以吗？`
2. Then say: `以后你叫我阿强可以吗？`
3. Start a fresh thread with the same agent
4. Ask: `请简单介绍一下你自己。`

Success criteria:

- the new thread still uses the nickname and preferred user name
- runtime summary still reports relationship memory usage

### 2. Remembered profession stays faithful in a direct follow-up question

- Priority: `P0`
- Category: `fidelity`
- Purpose: verify that a recalled profession is stated directly instead of being blurred or contradicted

Steps:

1. Send: `I am a product designer.`
2. Start a fresh thread
3. Ask: `What profession do you remember that I work in? If you do not know, say you do not know.`

Success criteria:

- the answer directly says `product designer`
- the reply does not confuse “no chat history” with “no long-term memory”

### 3. Replies follow the latest user message language instead of drifting

- Priority: `P0`
- Category: `language`
- Purpose: verify that the latest user turn has the highest language priority

Steps:

1. Send an English message such as: `Please introduce yourself briefly.`
2. Then send a Chinese message such as: `你记得我做什么工作吗？`
3. Expand the runtime summary on the later reply

Success criteria:

- the later Chinese turn receives a Chinese reply
- earlier English turns or recalled English memory do not pull the answer back to English

### 4. Relationship style continuity remains visible across multiple turns

- Priority: `P0`
- Category: `fidelity`
- Purpose: verify that relationship style is not only remembered but also performed across multiple turns in the same thread

Steps:

1. Seed: `以后和我说话轻松一点，可以吗？`
2. Ask: `请简单介绍一下你自己。`
3. Then ask: `接下来你会怎么帮助我？`

Success criteria:

- the tone remains lightweight and consistent across both replies
- same-thread continuity wins over distant defaults

### 5. Incorrect and restore change later recall eligibility predictably

- Priority: `P0`
- Category: `correction`
- Purpose: verify that correction controls affect later real-chat behavior, not just isolated memory rows

Steps:

1. Mark a nickname or profession memory as `Incorrect`
2. Start a fresh thread and ask the same direct question again
3. Restore the memory
4. Start another fresh thread and ask the same question again

Success criteria:

- `Incorrect` removes the memory from later recall
- `Restore` returns the same memory to later recall
