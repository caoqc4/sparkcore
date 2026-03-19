export type QualityEvalCase = {
  id: string;
  title: string;
  priority: "P0" | "P1";
  scenarioPack?:
    | "memory-confirmation"
    | "relationship-maintenance"
    | "mixed-language"
    | "correction-aftermath";
  category:
    | "memory"
    | "language"
    | "thread"
    | "correction"
    | "explanation"
    | "model-profile"
    | "scope"
    | "update"
    | "recall"
    | "fidelity";
  purpose: string;
  setup: string[];
  steps: string[];
  observe: string[];
  failureConditions?: string[];
  successCriteria: string[];
};

export type FailureAttributionDimension =
  | "fidelity"
  | "language"
  | "relationship-continuity"
  | "correction-consistency";

export type QualityEvalFailureAttribution = {
  requiredFields: string[];
  driftDimensions: FailureAttributionDimension[];
  developerReasonHints: string[];
  notes: string[];
};

export type QualityEvalAcceptanceThresholds = {
  pass: string[];
  acceptableMinorDrift: string[];
  mustOpenIssue: string[];
  notes: string[];
};

export type QualityEvalSuite = {
  id: "stage1" | "memory-v2" | "real-chat";
  title: string;
  intro: string;
  cases: QualityEvalCase[];
  failureAttribution?: QualityEvalFailureAttribution;
  acceptanceThresholds?: QualityEvalAcceptanceThresholds;
};

export const stage1QualityEvalSet: QualityEvalCase[] = [
  {
    id: "memory-hit-follow-up",
    title: "Memory-hit follow-up stays grounded in recalled facts",
    priority: "P0",
    category: "memory",
    purpose:
      "Check whether a recalled profile or preference memory is reflected in the final answer instead of being ignored or contradicted.",
    setup: [
      "Use an agent with a stable conversation-oriented model profile.",
      "Start from a clean thread so the test is not biased by previous turns."
    ],
    steps: [
      'Send: "I am a product designer and I prefer concise weekly planning."',
      'Then ask: "What profession do you remember that I work in? If you do not know, say you do not know."',
      "Expand the runtime summary under the assistant reply."
    ],
    observe: [
      "Whether Memory context shows at least one memory hit.",
      "Whether the final answer actually mentions the recalled profession instead of replying as if no prior knowledge exists."
    ],
    successCriteria: [
      "The assistant uses recalled memory in the final answer.",
      'The answer does not confuse "no chat history" with "no long-term memory".'
    ]
  },
  {
    id: "language-consistency-zh",
    title: "Chinese input receives a Chinese reply",
    priority: "P0",
    category: "language",
    purpose:
      "Verify that the assistant follows the user language for a Chinese turn without requiring manual language settings.",
    setup: [
      "Use any active agent.",
      "Run the test in a fresh thread if possible."
    ],
    steps: ['Send: "请用两句话介绍你自己，并说明你能如何帮助我。"'],
    observe: [
      "Whether the reply stays in Chinese.",
      "Whether the runtime summary still renders normally."
    ],
    successCriteria: [
      "The assistant reply is primarily in Chinese.",
      "The language does not drift into English without an explicit reason."
    ]
  },
  {
    id: "language-consistency-en",
    title: "English input receives an English reply",
    priority: "P0",
    category: "language",
    purpose:
      "Verify that the assistant follows the user language for an English turn without a separate language preference UI.",
    setup: [
      "Use the same agent and model profile as the Chinese case when comparing behavior."
    ],
    steps: ['Send: "Please introduce yourself in two short sentences and explain how you can help me."'],
    observe: [
      "Whether the reply stays in English.",
      "Whether any language switching feels intentional instead of drifting."
    ],
    successCriteria: [
      "The assistant reply is primarily in English.",
      "The reply does not drift into Chinese without an explicit reason."
    ]
  },
  {
    id: "thread-switch-continuity",
    title: "Thread switching preserves URL-scoped continuity",
    priority: "P0",
    category: "thread",
    purpose:
      "Verify that each thread keeps its own context and that switching between threads does not mix their histories.",
    setup: [
      "Create two different threads bound to visible agents.",
      "Send one distinctive message in each thread."
    ],
    steps: [
      "Open thread A and confirm its latest message preview.",
      "Switch to thread B and confirm a different preview or context.",
      "Refresh the page while thread B is active.",
      "Return to thread A using the sidebar."
    ],
    observe: [
      "Whether the URL stays aligned with the active thread.",
      "Whether the thread body and runtime summary belong to the selected thread."
    ],
    successCriteria: [
      "Refreshing keeps the current thread selected.",
      "Messages and summaries do not bleed across threads."
    ]
  },
  {
    id: "incorrect-restore-behavior",
    title: "Incorrect and restore change recall eligibility predictably",
    priority: "P0",
    category: "correction",
    purpose:
      "Verify that correction controls affect future recall and that restore reliably re-enables the memory.",
    setup: [
      "Pick a visible memory that is easy to test, such as a clear profession or preference."
    ],
    steps: [
      "Mark the memory as Incorrect.",
      "Start a fresh thread and ask a question that should use that memory.",
      "Restore the same memory.",
      "Start another fresh thread and ask the same question again."
    ],
    observe: [
      "Whether the runtime summary shows the memory being kept out of recall after Incorrect.",
      "Whether the summary shows memory hits again after Restore."
    ],
    successCriteria: [
      "Incorrect prevents the memory from participating in later recall.",
      "Restore makes the memory visible and recall-eligible again."
    ]
  },
  {
    id: "model-profile-comparison",
    title: "Model profile changes can be compared against the same prompt set",
    priority: "P0",
    category: "model-profile",
    purpose:
      "Create a stable comparison path for answer quality when swapping model profiles.",
    setup: [
      "Use the same agent and switch only the model profile between runs.",
      "Reuse the same test prompts from the memory and language cases."
    ],
    steps: [
      "Run the memory-hit follow-up case on profile A.",
      "Switch to profile B.",
      "Run the same case again in a fresh thread.",
      "Compare the final answer and runtime summary."
    ],
    observe: [
      "Whether the runtime summary reflects the selected profile.",
      "Whether answer quality becomes more or less faithful to recalled memory."
    ],
    successCriteria: [
      "The same eval case can be rerun across profiles without changing the scenario.",
      "Model profile comparisons can be judged against the same baseline instead of intuition."
    ]
  }
];

export const memoryV2EvalSet: QualityEvalCase[] = [
  {
    id: "memory-v2-write-shape",
    title: "Memory writes land in the expected category, key, and scope",
    priority: "P0",
    category: "memory",
    purpose:
      "Verify that new Memory v2 writes use the correct structured fields instead of falling back to ambiguous legacy-only behavior.",
    setup: [
      "Use a workspace with at least one visible agent and one clean thread.",
      "Open the memory panel so newly written records can be inspected."
    ],
    steps: [
      'Write a global fact such as: "I am a product designer."',
      'Write an agent-specific relationship fact such as: "以后我叫你小芳可以吗？"',
      "Inspect the resulting memory rows in the panel and runtime summary."
    ],
    observe: [
      "Whether profession lands as profile/profession in global scope.",
      "Whether nickname lands as relationship/agent_nickname in this-agent scope."
    ],
    successCriteria: [
      "Structured fields match the intended category, key, and scope.",
      "Relationship writes do not fall back into profile or preference memory."
    ]
  },
  {
    id: "memory-v2-scope-user-agent",
    title: "Agent nickname stays available for the same agent and does not leak to other agents",
    priority: "P0",
    category: "scope",
    purpose:
      "Verify that user_agent scope is bound to target_agent_id and behaves predictably across new threads.",
    setup: [
      "Use two active agents in the same workspace.",
      "Seed a nickname only on one of them."
    ],
    steps: [
      'On agent A, say: "以后我叫你小芳可以吗？"',
      'Open a fresh thread with agent A and ask: "你叫什么？"',
      'Open a fresh thread with agent B and ask: "你叫什么？"'
    ],
    observe: [
      "Whether agent A recalls the nickname.",
      "Whether agent B falls back to its canonical name."
    ],
    successCriteria: [
      "The same agent recalls the nickname in a new thread.",
      "A different agent does not reuse the nickname."
    ]
  },
  {
    id: "memory-v2-single-slot-update",
    title: "Single-slot nickname updates replace the active value without auto-merging",
    priority: "P0",
    category: "update",
    purpose:
      "Verify that single-slot update rules keep one active value per structured slot and avoid automatic content rewrites.",
    setup: [
      "Use one agent with a clean relationship nickname slot."
    ],
    steps: [
      'First say: "以后我叫你小芳可以吗？"',
      'Then say: "我改一下，以后叫你阿芳吧。"',
      'Open a fresh thread with the same agent and ask: "你叫什么？"'
    ],
    observe: [
      "Whether only one nickname remains active for recall.",
      "Whether the answer uses the newer nickname instead of merging both."
    ],
    successCriteria: [
      "The newer single-slot value wins.",
      "The system does not auto-generate a merged nickname."
    ]
  },
  {
    id: "memory-v2-direct-recall-priority",
    title: "Direct naming questions use structured nickname recall before fallback identity",
    priority: "P0",
    category: "recall",
    purpose:
      "Verify that direct name-related questions follow the structured recall priority instead of relying on fuzzy generation.",
    setup: [
      "Use an agent that already has an agent_nickname memory."
    ],
    steps: [
      'Ask: "你叫什么？"',
      'Ask: "我以后怎么叫你？"',
      'Ask: "你不是叫小芳吗？"'
    ],
    observe: [
      "Whether the replies consistently prefer the nickname.",
      "Whether the runtime summary reports relationship memory usage."
    ],
    successCriteria: [
      "Structured nickname recall is used first for direct naming questions.",
      "Canonical agent name only appears when no nickname is available."
    ]
  },
  {
    id: "memory-v2-answer-fidelity",
    title: "Structured memory hits stay faithful in the final answer",
    priority: "P0",
    category: "fidelity",
    purpose:
      "Verify that memory hits are reflected in the answer instead of being contradicted or blurred by unrelated wording.",
    setup: [
      "Use a model profile meant for memory-sensitive comparisons."
    ],
    steps: [
      'Write a fact such as: "I am a product designer."',
      'In a new thread, ask: "What profession do you remember that I work in? If you do not know, say you do not know."',
      "Expand the runtime summary."
    ],
    observe: [
      "Whether runtime summary shows the structured memory hit.",
      "Whether the answer directly states the profession instead of saying there is no prior knowledge."
    ],
    successCriteria: [
      'The answer does not confuse "no chat history" with "no long-term memory".',
      "The structured memory hit is reflected in the final answer."
    ]
  },
  {
    id: "memory-v2-correction-cycle",
    title: "Incorrect and restore change nickname recall eligibility predictably",
    priority: "P0",
    category: "correction",
    purpose:
      "Verify that correction controls work for relationship memory and that restore re-enables recall for the same agent only.",
    setup: [
      "Use an agent with a previously stored nickname."
    ],
    steps: [
      "Mark the nickname memory as Incorrect.",
      'Open a fresh thread with the same agent and ask: "你叫什么？"',
      "Restore the same memory.",
      'Open another fresh thread with the same agent and ask: "你叫什么？"'
    ],
    observe: [
      "Whether the same-agent recall falls back after Incorrect.",
      "Whether the nickname returns after Restore."
    ],
    successCriteria: [
      "Incorrect removes the nickname from recall for that agent.",
      "Restore makes the nickname recallable again for that agent."
    ]
  }
];

export const realChatQualityRegressionSet: QualityEvalCase[] = [
  {
    id: "real-chat-same-agent-relationship-continuity",
    title: "Same-agent nickname and preferred-name continuity survives a new thread and later short follow-ups",
    priority: "P0",
    scenarioPack: "relationship-maintenance",
    category: "thread",
    purpose:
      "Verify that relationship memories still feel continuous when a new thread is started with the same agent, and that they keep showing up after short follow-up turns instead of appearing only once.",
    setup: [
      "Use an agent that supports relationship memory.",
      "Seed both an agent nickname and a preferred user name on that same agent."
    ],
    steps: [
      'Say: "以后我叫你小芳可以吗？"',
      'Then say: "以后你叫我阿强可以吗？"',
      "Start a fresh thread with the same agent.",
      'Turn 1: ask "请简单介绍一下你自己。"',
      'Turn 2: send a short follow-up such as "那接下来呢？"',
      'Turn 3: ask "那你接下来会怎么称呼我？"',
      'Turn 4: send a short acknowledgment such as "好，继续。"',
      'Turn 5: ask "最后再简单介绍一下你自己。"' 
    ],
    observe: [
      "Whether the opening still uses the seeded nickname and preferred user name.",
      "Whether later short follow-ups still preserve the same relationship cues instead of dropping back to neutral wording.",
      "At which turn nickname or preferred-name continuity first weakens, if it weakens at all.",
      "Whether the runtime summary still reports relationship memory usage."
    ],
    failureConditions: [
      "Count it as failed at the first turn where the nickname disappears once even though the same agent and relationship memory should still be active.",
      "Count it as failed at the first turn where the preferred user name disappears once even though the same agent and relationship memory should still be active.",
      "Count it as failed if relationship memory should still apply but the runtime summary no longer shows relationship memory usage."
    ],
    successCriteria: [
      "The same agent keeps nickname and preferred-name continuity across a new thread.",
      "Relationship cues do not disappear after the first successful turn and stay stable through the later short chain.",
      "The behavior does not depend on staying inside one old thread."
    ]
  },
  {
    id: "real-chat-relationship-style-continuity",
    title: "Relationship style continuity remains visible from opening to closing turns in a longer chain",
    priority: "P0",
    scenarioPack: "relationship-maintenance",
    category: "fidelity",
    purpose:
      "Verify that relationship recall is not only remembered but also expressed consistently from the opening turn through mid-thread and closing-style follow-ups.",
    setup: [
      'Seed a relationship style such as: "以后和我说话轻松一点，可以吗？"',
      "Stay in the same thread with the same agent."
    ],
    steps: [
      'Turn 1: ask "请简单介绍一下你自己。"',
      'Turn 2: ask "接下来你会怎么帮助我？"',
      'Turn 3: ask "如果我今天状态不太好，你会怎么和我说？"',
      'Turn 4: ask "最后你会怎么陪我把事情推进下去？"',
      'Turn 5: ask "那你再简单鼓励我一句。"' 
    ],
    observe: [
      "Whether the tone stays lightweight and consistent across all replies.",
      "Whether the middle and later answers preserve the same-thread style instead of snapping back to a neutral default.",
      "At which turn the relationship style first becomes noticeably flatter, if it becomes flatter."
    ],
    failureConditions: [
      "Count it as failed at the first turn where the relationship tone clearly drops back to the default neutral style instead of keeping the seeded relationship style.",
      "Count it as failed if opening, explanatory, or closing turns stop reflecting the same-thread relationship style while the relationship memory is still active.",
      "Count it as failed if the answer still sounds correct in content but no longer performs the expected relationship cues."
    ],
    successCriteria: [
      "Relationship style remains visible across opening, middle, and closing-style turns in the same thread.",
      "Same-thread continuity wins over distant defaults."
    ]
  },
  {
    id: "real-chat-explanation-layer-guardrail",
    title: "Default explanation UI stays short even when runtime diagnostics become richer",
    priority: "P1",
    scenarioPack: "relationship-maintenance",
    category: "explanation",
    purpose:
      "Verify that the explanation surface shown to normal users stays focused on one main reason and brief outcomes instead of turning into an engineering diagnostics panel as runtime metadata grows.",
    setup: [
      "Use any active agent and create at least one assistant reply that produces a runtime summary.",
      "Prefer a reply that uses memory so the summary has something meaningful to show."
    ],
    steps: [
      "Open the runtime summary under the latest assistant reply.",
      "Check the summary headline and the first explanation sentence.",
      "Scan the visible summary body for developer-only diagnostic wording such as answer strategy, same-thread continuation, or raw language-detection labels."
    ],
    observe: [
      "Whether the toggle and headline still read like a short user-facing explanation instead of a debugging panel.",
      "Whether the expanded summary keeps one main reason in the first layer instead of stacking multiple primary explanations.",
      "Whether developer-only diagnostics remain absent from the default visible summary surface."
    ],
    failureConditions: [
      "Count it as failed if the default explanation grows into multiple top-level reason paragraphs instead of one main reason.",
      "Count it as failed if developer-only labels such as answer strategy, same-thread continuation, or raw language-detection fields appear in the default visible summary.",
      "Count it as failed if the explanation copy becomes noticeably longer or more technical than a short user-facing note."
    ],
    successCriteria: [
      "The default explanation still reads like one short main reason plus lightweight outcome hints.",
      "Developer diagnostics stay separate from the user explanation layer by default."
    ]
  },
  {
    id: "real-chat-profession-recall",
    title: "Remembered profession stays faithful across a longer direct-question chain",
    priority: "P0",
    scenarioPack: "memory-confirmation",
    category: "fidelity",
    purpose:
      "Verify that a recalled profession memory is reflected directly across more than one direct question instead of being watered down, contradicted, or forgotten after one correct answer.",
    setup: [
      "Use any stable conversation or memory-sensitive profile.",
      "Start from a clean thread for the seed turn."
    ],
    steps: [
      'Send: "I am a product designer."',
      "Start a fresh thread.",
      'Turn 1: ask "What profession do you remember that I work in? If you do not know, say you do not know."',
      'Turn 2: ask "So what kind of work do I do?"',
      'Turn 3: ask "Say it again in one short sentence."',
      'Turn 4: ask "What do you remember about my work?"'
    ],
    observe: [
      "Whether both replies continue to state the profession directly.",
      "Whether later answers still sound grounded instead of drifting into generic help text.",
      "At which turn structured profession recall first weakens, if it weakens at all.",
      "Whether the runtime summary shows a relevant memory hit."
    ],
    failureConditions: [
      'Count it as failed at the first turn where a reply no longer says "product designer" or an equivalent explicit profession even though the relevant memory should still be available.',
      'Count it as failed if the runtime summary still shows a relevant memory hit but the answer does not reflect the remembered profession.',
      'Count it as failed if the answer falls back to "I do not know" or generic help text while the profession memory should still be recallable.'
    ],
    successCriteria: [
      'The later direct questions keep using "product designer" explicitly.',
      'The replies do not confuse "no chat history" with "no long-term memory".'
    ]
  },
  {
    id: "real-chat-latest-language-priority",
    title: "Replies follow the latest user message language across a longer mixed-language chain",
    priority: "P0",
    scenarioPack: "mixed-language",
    category: "language",
    purpose:
      "Verify that the latest user turn has the highest language priority across a short sequence, even when earlier turns or recalled memory use another language.",
    setup: [
      "Use one agent in the same thread.",
      "Optionally seed a memory in English before the Chinese question."
    ],
    steps: [
      'Turn 1: send an English message such as "Please introduce yourself briefly."',
      'Turn 2: send a Chinese message such as "你记得我做什么工作吗？"',
      'Turn 3: send a short ambiguous Chinese follow-up such as "那接下来呢？"',
      'Turn 4: send another Chinese follow-up such as "再用一句话说一遍。"',
      'Turn 5: send "ok, now continue in Chinese."',
      "Expand the runtime summary on the later replies."
    ],
    observe: [
      "Whether the second reply stays primarily in Chinese.",
      "Whether the later short follow-ups also remain in Chinese instead of snapping back to English.",
      "At which turn language drift first appears, if it appears at all.",
      "Whether the reply language follows the latest user turn instead of the earlier English turn."
    ],
    failureConditions: [
      "Count it as failed at the first turn where a Chinese user message receives a primarily English reply without an explicit language-switch instruction.",
      "Count it as failed if a short same-thread Chinese follow-up snaps back to English because of earlier English turns or recalled English memory.",
      "Count it as failed if the reply language follows distant thread history more strongly than the current user's latest message."
    ],
    successCriteria: [
      "The later Chinese turns receive Chinese replies.",
      "The short same-thread follow-ups also stay in Chinese.",
      "Earlier thread language or recalled English memory does not pull the answer back to English."
    ]
  },
  {
    id: "real-chat-incorrect-restore-cycle",
    title: "Incorrect and restore change later recall eligibility predictably after several turns",
    priority: "P0",
    scenarioPack: "correction-aftermath",
    category: "correction",
    purpose:
      "Verify that a corrected memory really stops affecting later replies after the conversation continues for a few turns, and that restore brings it back in a predictable way.",
    setup: [
      "Use a relationship nickname or profession memory that is easy to test."
    ],
    steps: [
      "Mark the memory as Incorrect.",
      'Start a fresh thread and ask the same direct question again.',
      'Turn 2: add one short follow-up such as "那你现在还记得吗？"',
      'Turn 3: add another short follow-up such as "再确认一次？"',
      "Restore the memory.",
      'Start another fresh thread and ask the same question once more.',
      'Turn 5: add one short follow-up such as "那你现在还记得吗？"',
      'Turn 6: add another short follow-up such as "再确认一次？"'
    ],
    observe: [
      "Whether the first fresh-thread reply falls back after Incorrect.",
      "Whether the later short follow-ups after Incorrect still avoid the removed memory.",
      "Whether the second fresh-thread reply uses the memory again after Restore.",
      "Whether the later short follow-ups after Restore stay consistent with the restored memory.",
      "At which turn correction behavior becomes inconsistent, if it becomes inconsistent."
    ],
    failureConditions: [
      "Count it as failed if Incorrect is applied but any later turn still uses the removed memory as if it were active.",
      "Count it as failed if Restore is applied but any later turn still behaves as if the memory were unavailable.",
      "Count it as failed at the first turn where correction behavior flips back and forth across short follow-ups instead of staying stable."
    ],
    successCriteria: [
      "Incorrect removes the memory from later recall.",
      "Restore returns the same memory to later recall.",
      "The correction result stays stable across more than one reply."
    ]
  }
];

export const qualityEvalSuites: Record<QualityEvalSuite["id"], QualityEvalSuite> = {
  stage1: {
    id: "stage1",
    title: "SparkCore Stage 1 Quality Eval Set",
    intro:
      "Use this set when prompts, model profiles, or runtime instructions change and you want to compare quality against fixed examples.",
    cases: stage1QualityEvalSet
  },
  "memory-v2": {
    id: "memory-v2",
    title: "SparkCore Memory v2 Eval Matrix",
    intro:
      "Use this set when Memory v2 schema, scope, update, recall, or correction behavior changes and you need a repeatable baseline instead of relying on gut feel.",
    cases: memoryV2EvalSet
  },
  "real-chat": {
    id: "real-chat",
    title: "SparkCore Real Chat Quality Regression Set",
    intro:
      "Use this set when answer fidelity, language consistency, and relationship continuity change and you want a fixed baseline closer to real trial conversations, with explicit checkpoints for where decay first appears.",
    cases: realChatQualityRegressionSet,
    acceptanceThresholds: {
      pass: [
        "All P0 cases pass without a recorded failing turn.",
        "No case needs a drift-dimension note because no material drift appears.",
        "The default explanation layer still stays lightweight and user-facing."
      ],
      acceptableMinorDrift: [
        "A single P1-only case shows a minor drift, but the run still has no P0 failure.",
        "The drift is isolated to one turn, remains recoverable within the same case, and does not break the case's main contract.",
        "The run still records the first failing turn, drift dimension, and one main developer reason so the drift can be watched later."
      ],
      mustOpenIssue: [
        "Any P0 case records a failing turn.",
        "Any drift clearly breaks the main contract of fidelity, language, relationship continuity, or correction consistency for that case.",
        "The same drift dimension appears across more than one case or scenario pack in the same run.",
        "A minor drift repeats across runs instead of remaining isolated."
      ],
      notes: [
        "Do not turn minor wording preference differences into failures unless they clearly break a case's main contract.",
        "Use the first failing turn and drift dimension to decide severity before discussing possible root causes.",
        "If a run lands in the acceptable-minor-drift bucket, finish the run, record it, and only then decide whether to open a follow-up issue."
      ]
    },
    failureAttribution: {
      requiredFields: [
        "scenario_pack",
        "case_id",
        "failed_turn",
        "drift_dimension",
        "main_developer_reason"
      ],
      driftDimensions: [
        "fidelity",
        "language",
        "relationship-continuity",
        "correction-consistency"
      ],
      developerReasonHints: [
        "answer_strategy_reason_code",
        "continuation_reason_code",
        "reply_language_source",
        "memory_used / recalled_memories"
      ],
      notes: [
        "When the run fails, record the first turn where drift becomes visible instead of only marking the whole case as failed.",
        "Use the smallest single drift dimension that best explains the failure, even if more than one symptom appears later.",
        "The main developer reason should stay lightweight: capture the one diagnostics clue that best explains the failing turn instead of pasting the whole metadata object."
      ]
    }
  }
};
