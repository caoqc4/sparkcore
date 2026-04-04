import { buildRuntimeMemoryUsageMetadata } from "@/lib/chat/runtime-preview-metadata";

async function main() {
  const preview = buildRuntimeMemoryUsageMetadata({
    updates: [
      {
        memory_item_id: "mem-1",
        usage_kind: "relationship_recall"
      }
    ],
    assistantMetadata: {
      memory: {
        relationship_recall: {
          used: true,
          direct_naming_question: false,
          direct_preferred_name_question: false,
          relationship_style_prompt: true,
          same_thread_continuity: true,
          recalled_keys: ["agent_nickname", "user_preferred_name"],
          recalled_memory_ids: ["mem-1", "mem-2"],
          adopted_agent_nickname_target: "小芳",
          adopted_user_preferred_name_target: "阿强"
        }
      }
    }
  });

  const relationshipRecall =
    preview.runtime_memory_usage?.relationship_recall ?? null;

  const results = [
    {
      id: "preview_reads_relationship_adoption_targets",
      actual: {
        adopted_agent_nickname_target:
          relationshipRecall?.adopted_agent_nickname_target ?? null,
        adopted_user_preferred_name_target:
          relationshipRecall?.adopted_user_preferred_name_target ?? null
      },
      expected: {
        adopted_agent_nickname_target: "小芳",
        adopted_user_preferred_name_target: "阿强"
      }
    }
  ].map((result) => ({
    ...result,
    pass:
      result.actual.adopted_agent_nickname_target ===
        result.expected.adopted_agent_nickname_target &&
      result.actual.adopted_user_preferred_name_target ===
        result.expected.adopted_user_preferred_name_target
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
      : "Unknown relationship adoption preview harness failure."
  );
  process.exitCode = 1;
});
