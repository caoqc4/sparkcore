import { stage1QualityEvalSet } from "@/lib/testing/quality-eval";

function renderMarkdown() {
  const lines: string[] = [
    "# SparkCore Stage 1 Quality Eval Set",
    "",
    "Use this set when prompts, model profiles, or runtime instructions change and you want to compare quality against fixed examples.",
    ""
  ];

  for (const item of stage1QualityEvalSet) {
    lines.push(`## ${item.id} — ${item.title}`);
    lines.push("");
    lines.push(`- Priority: ${item.priority}`);
    lines.push(`- Category: ${item.category}`);
    lines.push(`- Purpose: ${item.purpose}`);
    lines.push("");
    lines.push("### Setup");
    lines.push(...item.setup.map((entry) => `- ${entry}`));
    lines.push("");
    lines.push("### Steps");
    lines.push(...item.steps.map((entry, index) => `${index + 1}. ${entry}`));
    lines.push("");
    lines.push("### What to Observe");
    lines.push(...item.observe.map((entry) => `- ${entry}`));
    lines.push("");
    lines.push("### Success Criteria");
    lines.push(...item.successCriteria.map((entry) => `- ${entry}`));
    lines.push("");
  }

  return lines.join("\n");
}

function main() {
  const format =
    process.argv.find((arg) => arg.startsWith("--format="))?.split("=")[1] ??
    "markdown";

  if (format === "json") {
    console.log(JSON.stringify(stage1QualityEvalSet, null, 2));
    return;
  }

  console.log(renderMarkdown());
}

main();
