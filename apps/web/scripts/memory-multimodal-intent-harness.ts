import {
  detectMultimodalIntentByRules,
  extractExplicitAudioContent,
} from "@/lib/chat/multimodal-intent-decision";

async function main() {
  const results = [
    {
      id: "ordinary_say_one_sentence_does_not_trigger_audio",
      actual: detectMultimodalIntentByRules("我今天有点累，只想跟你说一句我状态不太好。"),
      expected: {
        imageRequested: false,
        audioRequested: false,
      }
    },
    {
      id: "explicit_audio_reply_still_triggers_audio",
      actual: detectMultimodalIntentByRules("请用语音回我一句晚安。"),
      expected: {
        imageRequested: false,
        audioRequested: true,
      }
    },
    {
      id: "explicit_audio_content_extraction_still_works",
      actual: extractExplicitAudioContent("说给我听：晚安，阿照。"),
      expected: "晚安，阿照。"
    },
    {
      id: "image_request_remains_detectable",
      actual: detectMultimodalIntentByRules("发我一张杭州周末散步路线图。"),
      expected: {
        imageRequested: true,
        audioRequested: false,
      }
    }
  ].map((result) => ({
    ...result,
    pass: JSON.stringify(result.actual) === JSON.stringify(result.expected)
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
      : "Unknown multimodal intent harness failure."
  );
  process.exitCode = 1;
});
