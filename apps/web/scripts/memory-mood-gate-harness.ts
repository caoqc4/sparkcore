import { isDurableMoodCandidate } from "@/lib/chat/memory-write";

type MoodGateCase = {
  id: string;
  expected: boolean;
  candidate: {
    memory_type: "mood";
    content: string;
    should_store: true;
    confidence: number;
    reason: string;
  };
  latestUserMessage: string;
  recentContext: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
};

const CASES: MoodGateCase[] = [
  {
    id: "transient_zh_today_sad",
    expected: false,
    candidate: {
      memory_type: "mood",
      content: "今天有点难过",
      should_store: true,
      confidence: 0.92,
      reason: "用户表达了当前情绪"
    },
    latestUserMessage: "我今天有点难过。",
    recentContext: []
  },
  {
    id: "durable_zh_recently_anxious",
    expected: true,
    candidate: {
      memory_type: "mood",
      content: "这段时间总是很焦虑",
      should_store: true,
      confidence: 0.92,
      reason: "用户描述了持续情绪模式"
    },
    latestUserMessage: "我这段时间总是很焦虑。",
    recentContext: []
  },
  {
    id: "repeated_context_tired",
    expected: true,
    candidate: {
      memory_type: "mood",
      content: "最近很累",
      should_store: true,
      confidence: 0.88,
      reason: "用户连续表达疲惫状态"
    },
    latestUserMessage: "最近真的很累。",
    recentContext: [{ role: "user", content: "这周一直都好累。" }]
  },
  {
    id: "single_mention_unclear_anxious",
    expected: false,
    candidate: {
      memory_type: "mood",
      content: "有些焦虑",
      should_store: true,
      confidence: 0.9,
      reason: "用户表达了焦虑"
    },
    latestUserMessage: "我有些焦虑。",
    recentContext: []
  },
  {
    id: "transient_en_right_now",
    expected: false,
    candidate: {
      memory_type: "mood",
      content: "feeling sad right now",
      should_store: true,
      confidence: 0.9,
      reason: "The user described a current feeling."
    },
    latestUserMessage: "I feel sad right now.",
    recentContext: []
  },
  {
    id: "durable_en_for_weeks",
    expected: true,
    candidate: {
      memory_type: "mood",
      content: "been feeling anxious for weeks",
      should_store: true,
      confidence: 0.94,
      reason: "The user described a recurring emotional pattern."
    },
    latestUserMessage: "I've been feeling anxious for weeks.",
    recentContext: []
  }
];

async function main() {
  const results = CASES.map((testCase) => {
    const actual = isDurableMoodCandidate({
      candidate: testCase.candidate,
      latestUserMessage: testCase.latestUserMessage,
      recentContext: testCase.recentContext
    });

    return {
      id: testCase.id,
      expected: testCase.expected,
      actual,
      pass: actual === testCase.expected
    };
  });

  const failed = results.filter((result) => !result.pass);

  console.log(
    JSON.stringify(
      {
        status: failed.length === 0 ? "ok" : "failed",
        total: results.length,
        passed: results.length - failed.length,
        failed: failed.length,
        results
      },
      null,
      2
    )
  );

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

void main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Unknown mood gate harness failure."
  );
  process.exitCode = 1;
});
