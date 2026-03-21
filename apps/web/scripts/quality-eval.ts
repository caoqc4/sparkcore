import { qualityEvalSuites } from "@/lib/testing/quality-eval";

const REAL_CHAT_SCENARIO_PACK_LABELS = {
  "memory-confirmation": "Memory Confirmation Pack",
  "relationship-maintenance": "Relationship Maintenance Pack",
  "mixed-language": "Mixed-Language Pack",
  "correction-aftermath": "Correction Aftermath Pack",
  "long-chain-continuity": "Long-Chain Continuity Pack"
} as const;

function renderMarkdown(suiteId: keyof typeof qualityEvalSuites) {
  const suite = qualityEvalSuites[suiteId];
  const lines: string[] = [
    `# ${suite.title}`,
    "",
    suite.intro,
    ""
  ];

  if (suite.failureAttribution) {
    lines.push("## Failure Attribution Record");
    lines.push("");
    lines.push(
      "When a case fails, record the first failing turn with a lightweight attribution note:"
    );
    lines.push(
      ...suite.failureAttribution.requiredFields.map((entry) => `- ${entry}`)
    );
    lines.push("");
    lines.push("Supported drift dimensions:");
    lines.push(
      ...suite.failureAttribution.driftDimensions.map((entry) => `- ${entry}`)
    );
    lines.push("");
    lines.push("Suggested developer reason clues:");
    lines.push(
      ...suite.failureAttribution.developerReasonHints.map(
        (entry) => `- ${entry}`
      )
    );
    lines.push("");
    lines.push("Recording notes:");
    lines.push(...suite.failureAttribution.notes.map((entry) => `- ${entry}`));
    lines.push("");
  }

  if (suite.acceptanceThresholds) {
    lines.push("## Acceptance Thresholds");
    lines.push("");
    lines.push("Pass:");
    lines.push(...suite.acceptanceThresholds.pass.map((entry) => `- ${entry}`));
    lines.push("");
    lines.push("Acceptable minor drift:");
    lines.push(
      ...suite.acceptanceThresholds.acceptableMinorDrift.map(
        (entry) => `- ${entry}`
      )
    );
    lines.push("");
    lines.push("Must-open-issue:");
    lines.push(
      ...suite.acceptanceThresholds.mustOpenIssue.map((entry) => `- ${entry}`)
    );
    lines.push("");
    lines.push("Decision notes:");
    lines.push(...suite.acceptanceThresholds.notes.map((entry) => `- ${entry}`));
    lines.push("");
  }

  let activeScenarioPack: keyof typeof REAL_CHAT_SCENARIO_PACK_LABELS | null = null;

  for (const item of suite.cases) {
    if (suiteId === "real-chat" && item.scenarioPack) {
      if (activeScenarioPack !== item.scenarioPack) {
        activeScenarioPack = item.scenarioPack;
        lines.push(`## ${REAL_CHAT_SCENARIO_PACK_LABELS[item.scenarioPack]}`);
        lines.push("");
      }
    }

    lines.push(
      `${suiteId === "real-chat" ? "###" : "##"} ${item.id} — ${item.title}`
    );
    lines.push("");
    if (item.scenarioPack) {
      lines.push(
        `- Scenario pack: ${
          suiteId === "real-chat"
            ? REAL_CHAT_SCENARIO_PACK_LABELS[item.scenarioPack]
            : item.scenarioPack
        }`
      );
    }
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
    if (item.executionNotes?.length) {
      lines.push("### Execution Notes");
      lines.push(...item.executionNotes.map((entry) => `- ${entry}`));
      lines.push("");
    }
    if (item.failureModePriority?.length) {
      lines.push("### Failure Mode Priority");
      lines.push(...item.failureModePriority.map((entry) => `- ${entry}`));
      lines.push("");
    }
    if (item.failureConditions?.length) {
      lines.push("### Failure Conditions");
      lines.push(...item.failureConditions.map((entry) => `- ${entry}`));
      lines.push("");
    }
    if (item.verdictOptions?.length) {
      lines.push("### Scenario Verdict Options");
      lines.push(...item.verdictOptions.map((entry) => `- ${entry}`));
      lines.push("");
    }
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
