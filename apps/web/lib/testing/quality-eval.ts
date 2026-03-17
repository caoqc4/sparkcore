export type QualityEvalCase = {
  id: string;
  title: string;
  priority: "P0" | "P1";
  category:
    | "memory"
    | "language"
    | "thread"
    | "correction"
    | "model-profile";
  purpose: string;
  setup: string[];
  steps: string[];
  observe: string[];
  successCriteria: string[];
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
