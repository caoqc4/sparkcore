import { shouldPreferMemoryRecordRecall } from "@/lib/chat/memory-recall";

type RecallRoutingCase = {
  id: string;
  message: string;
  expected: boolean;
};

const CASES: RecallRoutingCase[] = [
  {
    id: "goal_question_zh",
    message: "你还记得我这周的计划吗？",
    expected: true
  },
  {
    id: "social_question_zh",
    message: "我之前提过我男朋友吗？",
    expected: true
  },
  {
    id: "key_date_question_zh",
    message: "你记得我的生日是哪天吗？",
    expected: true
  },
  {
    id: "goal_question_en",
    message: "Do you remember what goal I'm working on right now?",
    expected: true
  },
  {
    id: "profile_preference_question_zh",
    message: "你记得我喜欢什么回复风格吗？",
    expected: false
  },
  {
    id: "identity_question_zh",
    message: "你记得我叫什么吗？",
    expected: false
  }
];

async function main() {
  const results = CASES.map((testCase) => {
    const actual = shouldPreferMemoryRecordRecall(testCase.message);

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
    error instanceof Error
      ? error.message
      : "Unknown recall routing harness failure."
  );
  process.exitCode = 1;
});
