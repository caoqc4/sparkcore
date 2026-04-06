import {
  FIXED_IMAGE_MODEL_ID,
  FIXED_TEXT_MODEL_ID
} from "@/lib/ai/fixed-models";
import {
  AiProviderError,
  generateImage,
  generateText
} from "@/lib/ai/client";
import { loadLocalEnv } from "./load-local-env";

loadLocalEnv();

function getArgValue(flag: string) {
  const index = process.argv.indexOf(flag);

  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const textPrompt =
    getArgValue("--prompt") ??
    "Write a short greeting for the SparkCore direct model integration test.";
  const imagePrompt =
    getArgValue("--image-prompt") ??
    "A minimal watercolor postcard of Shanghai skyline at sunrise, soft light, clean composition.";

  let hasFailure = false;

  try {
    const textResult = await generateText({
      model: FIXED_TEXT_MODEL_ID,
      messages: [{ role: "user", content: textPrompt }]
    });

    console.log("Text generation succeeded.");
    console.log(`Model: ${textResult.model}`);
    console.log("");
    console.log(textResult.content);
  } catch (error) {
    hasFailure = true;
    if (error instanceof AiProviderError) {
      console.error(`Text provider error (${error.status}): ${error.message}`);

      if (error.details) {
        console.error(JSON.stringify(error.details, null, 2));
      }
    } else if (error instanceof Error) {
      console.error(`Text test failed: ${error.message}`);
    } else {
      console.error("Unknown text test failure.");
    }
  }

  console.log("");

  try {
    const imageResult = await generateImage({
      model: FIXED_IMAGE_MODEL_ID,
      prompt: imagePrompt
    });

    console.log("Image generation succeeded.");
    console.log(`Model: ${imageResult.model}`);
    console.log("");
    console.log(imageResult.url);
  } catch (error) {
    hasFailure = true;
    if (error instanceof AiProviderError) {
      console.error(`Image provider error (${error.status}): ${error.message}`);

      if (error.details) {
        console.error(JSON.stringify(error.details, null, 2));
      }
    } else if (error instanceof Error) {
      console.error(`Image test failed: ${error.message}`);
    } else {
      console.error("Unknown image test failure.");
    }
  }

  if (hasFailure) {
    process.exitCode = 1;
  }
}

void main();
