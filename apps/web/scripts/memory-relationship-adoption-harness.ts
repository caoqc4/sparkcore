import { buildRelationshipAdoptionInstructions } from "@/lib/chat/runtime";

type RelationshipAdoptionCase = {
  id: string;
  actual: () => boolean;
};

const CASES: RelationshipAdoptionCase[] = [
  {
    id: "same_thread_continuation_keeps_preferred_name_and_nickname",
    actual: () => {
      const instructions = buildRelationshipAdoptionInstructions({
        isZh: true,
        mode: "same-thread-continuation",
        relationshipRecall: {
          preferredNameMemory: {
            memory_type: "relationship",
            content: "阿强",
            confidence: 0.98
          },
          nicknameMemory: {
            memory_type: "relationship",
            content: "小芳",
            confidence: 0.97
          }
        }
      }).join("\n");

      return (
        instructions.includes("阿强") &&
        instructions.includes("小芳") &&
        instructions.includes("不要退回") &&
        instructions.includes("canonical name")
      );
    }
  },
  {
    id: "open_ended_summary_prefers_stored_names",
    actual: () => {
      const instructions = buildRelationshipAdoptionInstructions({
        isZh: true,
        mode: "open-ended-summary",
        relationshipRecall: {
          preferredNameMemory: {
            memory_type: "relationship",
            content: "阿强",
            confidence: 0.98
          },
          nicknameMemory: {
            memory_type: "relationship",
            content: "小芳",
            confidence: 0.97
          }
        }
      }).join("\n");

      return (
        instructions.includes("如果这轮回复里需要称呼用户") &&
        instructions.includes("如果这轮回复里会提到你自己的名字、自我介绍或开场自称") &&
        instructions.includes("阿强") &&
        instructions.includes("小芳")
      );
    }
  },
  {
    id: "advice_mode_with_only_preferred_name_still_guides_adoption",
    actual: () => {
      const instructions = buildRelationshipAdoptionInstructions({
        isZh: false,
        mode: "open-ended-advice",
        relationshipRecall: {
          preferredNameMemory: {
            memory_type: "relationship",
            content: "A-Qiang",
            confidence: 0.98
          },
          nicknameMemory: null
        }
      }).join("\n");

      return (
        instructions.includes('stored preferred name "A-Qiang"') &&
        instructions.includes("generic wording") &&
        !instructions.includes("canonical name")
      );
    }
  }
];

async function main() {
  const results = CASES.map((testCase) => ({
    id: testCase.id,
    pass: testCase.actual()
  }));
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
      : "Unknown relationship adoption harness failure."
  );
  process.exitCode = 1;
});
