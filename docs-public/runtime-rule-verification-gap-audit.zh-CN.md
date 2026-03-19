# SparkCore Runtime 规则验证缺口审计

当我们要决定下一条 QA 任务该补什么时，用这份短审计来判断：哪些 runtime 规则已经覆盖得够稳，哪些还应该继续补 focused regression。

这份文档刻意保持轻量。它不是完整测试策略，只是当前 runtime-rule surface 的一份短审计，目的是继续把隐含行为收敛成可重复执行的检查，而不是靠团队记忆。

## 当前已较强覆盖

- 明确事实 recall：
  - 职业 recall
  - planning preference recall
  - reply style recall
- relationship recall：
  - agent nickname scope
  - preferred-name scope
  - same-agent continuity
- 开放式 answer shape：
  - grounded advice
  - grounded summary
- same-thread continuation：
  - fuzzy follow-up 优先于 distant memory fallback
  - 短 carryover turn 的 relationship continuity
  - mixed-language short follow-up
- 用户 explanation guardrail：
  - 默认 explanation surface 只保留一条 main reason
  - developer diagnostics 不泄漏到默认 explanation surface
- 纠错控制：
  - relationship memory 上的 `Incorrect` / `Restore`
- 线程 / runtime 基础链路：
  - URL 恢复 thread
  - thread-agent continuity

## 这一轮已转成 focused regression 的高价值缺口

### 1. 模糊跟进时的语言来源

之前的缺口：
- 我们已经验证过：当用户当前消息明确是中文时，mixed-language follow-up 会继续用中文。
- 但还没有一条 focused regression 专门验证：当用户当前消息语言不明显时，runtime 应该回退到 same-thread continuity 的语言来源。

这轮新增的 focused regression：
- 在英文 assistant turn 之后发送一个语言不明显的短跟进
- 期望 diagnostics：
  - `answer_strategy=same-thread-continuation`
  - `answer_strategy_reason_code=same-thread-edge-carryover`
  - `continuation_reason_code=short-fuzzy-follow-up`
  - `reply_language_source=thread-continuity-fallback`

### 2. 没有既有 thread carryover 时的 relationship answer-shape 路由

之前的缺口：
- 我们已经覆盖了 thread style 已形成后的 continuity。
- 但还没有一条 focused regression 专门证明：在 fresh thread 里，如果用户问的是 relationship-shaped explanatory prompt，它仍会走预期的 answer-shape 分支，而不是只能靠后续 same-thread carryover 才表现正常。

这轮新增的 focused regression：
- 在已有 relationship-style memory 的前提下，新 thread 里直接问 explanatory relationship prompt
- 期望 diagnostics：
  - `question_type=open-ended-summary`
  - `answer_strategy=grounded-open-ended-summary`
  - `answer_strategy_reason_code=relationship-answer-shape-prompt`
  - `same_thread_continuation_preferred=false`

### 3. `default-grounded` fallback 分支

之前的缺口：
- 这个分支已经存在于 runtime diagnostics 中。
- 但我们还没有一条专门把它稳定隔离出来的 focused smoke。

这轮新增的 focused regression：
- 在一条已 seed memory 的 thread 里发送不属于其他分类的 grounded prompt
- 期望 diagnostics：
  - `question_type=other`
  - `answer_strategy=default-grounded`
  - `answer_strategy_reason_code=default-grounded-fallback`
  - `same_thread_continuation_preferred=false`

### 4. correction aftermath 的 metadata

之前的缺口：
- 我们已经覆盖了 correction 行为本身。
- 但还没有像 answer-shape routing 这样精细的 metadata-focused regression 去解释后续 turn 的 correction 行为。

这轮新增的 focused regression：
- 把一条 relationship nickname memory 标成 `Incorrect`，验证下一条 fresh-thread 直问名字会带着 correction metadata 回退；再 `Restore`，验证后面一条 fresh-thread 直问名字会重新召回昵称
- 期望 diagnostics：
  - `Incorrect` 后：
    - `question_type=direct-relationship-confirmation`
    - `answer_strategy=relationship-recall-first`
    - `answer_strategy_reason_code=direct-relationship-question`
    - `memory_hit_count=0`
    - `incorrect_memory_exclusion_count=1`
  - `Restore` 后：
    - `question_type=direct-relationship-confirmation`
    - `answer_strategy=relationship-recall-first`
    - `answer_strategy_reason_code=direct-relationship-question`
    - `memory_hit_count=1`
    - `incorrect_memory_exclusion_count=0`

## 仍然存在但优先级较低的缺口

### 1. model-profile comparison 的 cheap smoke

当前情况：
- model-profile comparison 已经存在于 eval 文档和更宽的 smoke 覆盖里。
- 但还没有一条专门只验证 model-profile comparison metadata 的窄 regression。

为什么优先级较低：
- 它对 QA 纪律有帮助，但没有 runtime-rule routing / continuity regression 那么急。

## 建议的下一步转换顺序

1. 只有当 profile-switch 回归再次频繁出现时，再补一条 cheap model-profile comparison smoke。
