import { qualityEvalSuites } from "@/lib/testing/quality-eval";

function renderMarkdown(suiteId: keyof typeof qualityEvalSuites) {
  const suite = qualityEvalSuites[suiteId];
  const lines: string[] = [
    `# ${suite.title}`,
    "",
    suite.intro,
    ""
  ];

  for (const item of suite.cases) {
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
  const suiteId =
    (process.argv.find((arg) => arg.startsWith("--suite="))?.split("=")[1] as
      | keyof typeof qualityEvalSuites
      | undefined) ?? "stage1";
  const resolvedSuiteId =
    suiteId in qualityEvalSuites ? suiteId : "stage1";

  if (format === "json") {
    console.log(JSON.stringify(qualityEvalSuites[resolvedSuiteId], null, 2));
    return;
  }

  console.log(renderMarkdown(resolvedSuiteId));
}

main();
