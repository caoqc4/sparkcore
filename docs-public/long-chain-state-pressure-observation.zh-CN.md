# 长链路状态压力观察指引

当一轮 real-chat 验收在规则层已经大体稳定，但你想判断剩余衰减是不是开始更像“长链路 thread state 压力”时，用这份指引。

这不是一个 thread-compaction 任务。

不要把这份指引当成现在就可以去做下面这些事情的许可：

- `thread summary`
- `thread state packet`
- `thread compaction`
- 新的用户可见 UI
- 注入到回答里的 diagnostics

## 观察前提

只有同时满足下面几点时，才启用这组观察：

- 当前这轮没有确认过的普通规则层 `P0` 产品漂移
- 链路已经足够长，连续性承压是合理怀疑，一般在 6 到 10+ turn 左右
- 观察到的变弱更像上下文延续开始吃力，而不是 recall contract 直接坏掉

建议关注的 developer-only clue：

- `recent_raw_turn_count`
- `approx_context_pressure`
- `same_thread_continuation_applicable`
- `long_chain_pressure_candidate`
- `first_detected_drift_turn`
- `drift_dimension`

## 怎么理解这些信号

- `recent_raw_turn_count`
  - 当前 turn 前后，这个 thread 里已经背着的非失败原始消息数量近似值
- `approx_context_pressure`
  - 当前 thread 上下文拥挤程度的轻量分桶：`low`、`medium`、`elevated`、`high`
- `same_thread_continuation_applicable`
  - 当前这一轮是否仍属于“same-thread continuity 本来就应该继续起作用”的场景
- `long_chain_pressure_candidate`
  - 只是观察旗标，不是证据；它只表示这一轮已经足够长、而且足够依赖 continuity，值得继续盯

这些信号只能留在 `developer_diagnostics` 和验收记录里。

## 升级门槛

不要因为一两次长链路漂移，就直接升级成真正的 thread-state / compaction 任务。  
只有开始反复出现下面这个模式，才值得认真考虑：

1. 当前验收窗口里的 runtime-rule 检查已经基本稳定
2. 漂移仍然反复出现在更长的 same-thread 链路里
3. 这些反复出现的漂移，更像长链路 continuity 承压，而不是 recall contract 失败
4. 这种模式在后续至少一轮验收里还会再出现，而不是只出现一次

如果问题仍然更像下面这些原因：

- answer strategy 选错
- 语言路由不对
- relationship recall 漏掉
- correction 不一致

那它仍属于 runtime-rule 桶，不应提前当成 compaction 证据。

## 记录模板

当某条长链路候选漂移需要在验收里记下来时，用这份轻量模板：

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
```

`decision` 只用下面三档之一：

- `rule-layer drift`
- `watch only`
- `state-pressure candidate`

## 判断规则

- 当失败仍然最像是现有 routing / recall / continuity 规则缺口时，记成 `rule-layer drift`
- 当链路变长了、这些信号也开始值得看，但证据还不够厚时，记成 `watch only`
- 只有当你看到反复出现的长链路 continuity 承压，而且已经不太像普通规则漂移时，才记成 `state-pressure candidate`
