import { loadEnvConfig } from "@next/env";
import { generateText, LiteLLMError } from "@/lib/litellm/client";

loadEnvConfig(process.cwd());

function getArgValue(flag: string) {
  const index = process.argv.indexOf(flag);

  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const model = getArgValue("--model");
  const prompt =
    getArgValue("--prompt") ??
    "Write a short greeting for the SparkCore LiteLLM integration test.";

  if (!model) {
    console.error(
      "Missing required --model argument. Example: npm run litellm:test -- --model gpt-4o-mini"
    );
    process.exitCode = 1;
    return;
  }

  try {
    const result = await generateText({
      model,
      messages: [{ role: "user", content: prompt }]
    });

    console.log("LiteLLM text generation succeeded.");
    console.log(`Model: ${result.model}`);
    console.log("");
    console.log(result.content);
  } catch (error) {
    if (error instanceof LiteLLMError) {
      console.error(`LiteLLM error (${error.status}): ${error.message}`);

      if (error.details) {
        console.error(JSON.stringify(error.details, null, 2));
      }
    } else if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error("Unknown LiteLLM test failure.");
    }

    process.exitCode = 1;
  }
}

void main();
