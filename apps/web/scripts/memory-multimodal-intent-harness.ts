import {
  detectMultimodalIntentByRules,
  detectMultimodalIntent,
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
    },
    {
      id: "natural_english_photo_request_is_detectable",
      actual: detectMultimodalIntentByRules("Can you give me a photo about the sea?"),
      expected: {
        imageRequested: true,
        audioRequested: false,
      }
    },
    {
      id: "your_photo_request_uses_role_consistency",
      actual: await detectMultimodalIntent("Can you give me your photo?"),
      expected: {
        imageRequested: true,
        audioRequested: false,
        explicitHumanSubjectRequested: true,
        shouldUseRolePortraitReference: true,
        rolePortraitReferenceStrength: "strong",
      }
    },
    {
      id: "chinese_self_photo_request_uses_role_consistency",
      actual: await detectMultimodalIntent("可以给我看看你的照片吗？"),
      expected: {
        imageRequested: true,
        audioRequested: false,
        explicitHumanSubjectRequested: true,
        shouldUseRolePortraitReference: true,
        rolePortraitReferenceStrength: "strong",
      }
    },
    {
      id: "scene_with_you_request_requires_human_subject",
      actual: await detectMultimodalIntent("发一张你站在森林里的照片"),
      expected: {
        imageRequested: true,
        audioRequested: false,
        explicitHumanSubjectRequested: true,
        shouldUseRolePortraitReference: true,
      }
    }
  ].map((result) => ({
    ...result,
    pass:
      typeof result.expected === "string"
        ? result.actual === result.expected
        : Object.entries(result.expected).every(
            ([key, value]) =>
              (result.actual as Record<string, unknown> | null | undefined)?.[key] === value
          )
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
