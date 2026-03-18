export type QualityEvalCase = {
  id: string;
  title: string;
  priority: "P0" | "P1";
  category:
    | "memory"
    | "language"
    | "thread"
    | "correction"
    | "model-profile"
    | "scope"
    | "update"
    | "recall"
    | "fidelity";
  purpose: string;
  setup: string[];
  steps: string[];
  observe: string[];
  successCriteria: string[];
};

export type QualityEvalSuite = {
  id: "stage1" | "memory-v2";
  title: string;
  intro: string;
  cases: QualityEvalCase[];
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
  }
};
