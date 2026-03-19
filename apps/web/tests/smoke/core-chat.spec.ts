import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const smokeSecret = process.env.PLAYWRIGHT_SMOKE_SECRET ?? "sparkcore-smoke-local";
const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const runtimeSummaryTogglePattern =
  /How this reply was generated|Why this turn|Main reason|这轮依据|这轮主要依据/;
const relationshipMemoryReasonPattern =
  /This turn used relationship memory\.|Used relationship memory this turn\./;
const developerDiagnosticsLeakPattern =
  /answer strategy|same-thread continuation|reply language detected|developer diagnostics/i;

function getSmokeAdminClient() {
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

async function getLatestAssistantMessageForThread(
  threadId: string
) {
  const admin = getSmokeAdminClient();
  const { data, error } = await admin
    .from("messages")
    .select("content, metadata")
    .eq("thread_id", threadId)
    .eq("role", "assistant")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  expect(error).toBeNull();
  expect(data).toBeTruthy();

  return data as {
    content: string;
    metadata: Record<string, unknown>;
  };
}

function getLatestRuntimeSummaryHeading(page: Page) {
  return page.locator("summary").filter({ hasText: runtimeSummaryTogglePattern }).last();
}

test.describe("core chat smoke", () => {
  test.skip(
    !hasServiceRole,
    "SUPABASE_SERVICE_ROLE_KEY is required to seed and reset the smoke workspace."
  );

  test.beforeEach(async ({ page, request }) => {
    const resetResponse = await request.post("/api/test/smoke-reset", {
      headers: {
        "x-smoke-secret": smokeSecret
      }
    });

    expect(resetResponse.ok()).toBeTruthy();

    await page.goto(`/api/test/smoke-login?secret=${smokeSecret}&redirect=/chat`);
    await expect(page).toHaveURL(/\/chat/);
    await expect(
      page.getByRole("heading", { name: "Thread workspace is ready" })
    ).toBeVisible();
  });

  test("creates a thread, sends the first messages, and restores thread state from the URL", async ({
    page,
    request
  }) => {
    await expect(page.getByText("No threads yet")).toBeVisible();
    await expect(page.locator('select[name="agent_id"]')).toContainText(
      "Smoke Guide"
    );

    const createThreadResponse = await request.post("/api/test/smoke-create-thread", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        agentName: "Smoke Guide"
      }
    });

    expect(createThreadResponse.ok()).toBeTruthy();

    const createThreadPayload = (await createThreadResponse.json()) as {
      threadId: string;
    };
    const threadOneId = createThreadPayload.threadId;
    expect(threadOneId).toBeTruthy();

    await page.goto(
      `/api/test/smoke-login?secret=${smokeSecret}&redirect=/chat?thread=${threadOneId}`
    );
    await expect(page).toHaveURL(new RegExp(`thread=${threadOneId}`));
    const sendTurnResponse = await request.post("/api/test/smoke-send-turn", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        threadId: threadOneId,
        content: "I am a product designer and I prefer concise weekly planning."
      }
    });

    expect(sendTurnResponse.ok()).toBeTruthy();
    await page.reload();

    const latestSummaryHeading = getLatestRuntimeSummaryHeading(page);
    await expect(
      latestSummaryHeading
    ).toBeVisible({ timeout: 90_000 });
    await latestSummaryHeading.click();
    await expect(page.getByText(/Saved new/i)).toBeVisible({ timeout: 90_000 });

    await page.reload();
    await expect(page).toHaveURL(new RegExp(`thread=${threadOneId}`));
    await expect(
      page.locator(`a[href="/chat?thread=${threadOneId}"][aria-current="page"]`)
    ).toBeVisible();
  });

  test("grounds direct memory recall questions in remembered facts", async ({
    page,
    request
  }) => {
    const seedThreadResponse = await request.post("/api/test/smoke-create-thread", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        agentName: "Smoke Guide"
      }
    });

    expect(seedThreadResponse.ok()).toBeTruthy();
    const { threadId: seedThreadId } = (await seedThreadResponse.json()) as {
      threadId: string;
    };

    const seedTurnResponse = await request.post("/api/test/smoke-send-turn", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        threadId: seedThreadId,
        content: "I am a product designer and I prefer concise weekly planning."
      }
    });

    expect(seedTurnResponse.ok()).toBeTruthy();

    const recallThreadResponse = await request.post("/api/test/smoke-create-thread", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        agentName: "Smoke Guide"
      }
    });

    expect(recallThreadResponse.ok()).toBeTruthy();
    const { threadId: recallThreadId } = (await recallThreadResponse.json()) as {
      threadId: string;
    };

    await page.goto(
      `/api/test/smoke-login?secret=${smokeSecret}&redirect=/chat?thread=${recallThreadId}`
    );

    const recallTurnResponse = await request.post("/api/test/smoke-send-turn", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        threadId: recallThreadId,
        content:
          "What profession do you remember that I work in? If you do not know, say you do not know."
      }
    });

    expect(recallTurnResponse.ok()).toBeTruthy();
    await page.reload();

    await expect(
      page.getByText("I remember that you work as a product designer.").first()
    ).toBeVisible({ timeout: 45_000 });

    const latestSummaryHeading = getLatestRuntimeSummaryHeading(page);
    await latestSummaryHeading.click();
    await expect(page.getByText(/1 memory hit/)).toBeVisible({
      timeout: 45_000
    });
  });

  test("grounds direct preference recall questions in remembered facts", async ({
    page,
    request
  }) => {
    const seedThreadResponse = await request.post("/api/test/smoke-create-thread", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        agentName: "Smoke Guide"
      }
    });

    expect(seedThreadResponse.ok()).toBeTruthy();
    const { threadId: seedThreadId } = (await seedThreadResponse.json()) as {
      threadId: string;
    };

    const seedTurnResponse = await request.post("/api/test/smoke-send-turn", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        threadId: seedThreadId,
        content: "I am a product designer and I prefer concise weekly planning."
      }
    });

    expect(seedTurnResponse.ok()).toBeTruthy();

    const recallThreadResponse = await request.post("/api/test/smoke-create-thread", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        agentName: "Smoke Guide"
      }
    });

    expect(recallThreadResponse.ok()).toBeTruthy();
    const { threadId: recallThreadId } = (await recallThreadResponse.json()) as {
      threadId: string;
    };

    await page.goto(
      `/api/test/smoke-login?secret=${smokeSecret}&redirect=/chat?thread=${recallThreadId}`
    );

    const recallTurnResponse = await request.post("/api/test/smoke-send-turn", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        threadId: recallThreadId,
        content:
          "What planning style do I prefer? If you do not know, say you do not know."
      }
    });

    expect(recallTurnResponse.ok()).toBeTruthy();
    await page.reload();

    await expect(page.getByText("You prefer concise weekly planning.").first()).toBeVisible({
      timeout: 45_000
    });

    const latestSummaryHeading = getLatestRuntimeSummaryHeading(page);
    await latestSummaryHeading.click();
    await expect(page.getByText(/1 memory hit/)).toBeVisible({
      timeout: 45_000
    });
  });

  test("keeps open-ended planning help grounded without turning it into a rigid fact dump", async ({
    page,
    request
  }) => {
    const seedThreadResponse = await request.post("/api/test/smoke-create-thread", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        agentName: "Smoke Guide"
      }
    });

    expect(seedThreadResponse.ok()).toBeTruthy();
    const { threadId: seedThreadId } = (await seedThreadResponse.json()) as {
      threadId: string;
    };

    const seedTurnResponse = await request.post("/api/test/smoke-send-turn", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        threadId: seedThreadId,
        content: "I am a product designer and I prefer concise weekly planning."
      }
    });

    expect(seedTurnResponse.ok()).toBeTruthy();

    const recallThreadResponse = await request.post("/api/test/smoke-create-thread", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        agentName: "Smoke Guide"
      }
    });

    expect(recallThreadResponse.ok()).toBeTruthy();
    const { threadId: recallThreadId } = (await recallThreadResponse.json()) as {
      threadId: string;
    };

    await page.goto(
      `/api/test/smoke-login?secret=${smokeSecret}&redirect=/chat?thread=${recallThreadId}`
    );

    const recallTurnResponse = await request.post("/api/test/smoke-send-turn", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        threadId: recallThreadId,
        content:
          "Given what you know about me, how should we plan my week?"
      }
    });

    expect(recallTurnResponse.ok()).toBeTruthy();
    await page.reload();

    const latestAssistantReply = page
      .locator("article")
      .filter({ hasText: "Assistant" })
      .last();

    await expect(latestAssistantReply).toContainText(
      /concise weekly planning/i,
      {
        timeout: 45_000
      }
    );
    await expect(latestAssistantReply).toContainText(
      /priorities|next steps|actionable plan/i
    );
    await expect(latestAssistantReply).not.toContainText(
      /i don't know|我不知道/i
    );

    const latestAssistantMessage = await getLatestAssistantMessageForThread(
      recallThreadId
    );
    const metadata = latestAssistantMessage.metadata;
    const recalledMemories = Array.isArray(metadata.recalled_memories)
      ? metadata.recalled_memories
      : [];
    const recalledMemoryTypes = recalledMemories
      .map((memory) =>
        typeof memory === "object" && memory !== null
          ? (memory as Record<string, unknown>).memory_type
          : null
      )
      .filter((value): value is string => typeof value === "string");

    expect(metadata.question_type).toBe("open-ended-advice");
    expect(metadata.answer_strategy).toBe("grounded-open-ended-advice");
    expect(metadata.answer_strategy_reason_code).toBe("open-ended-advice-prompt");
    expect(metadata.memory_used).toBe(true);
    expect(recalledMemoryTypes).toEqual(
      expect.arrayContaining(["preference"])
    );

    const latestSummaryHeading = getLatestRuntimeSummaryHeading(page);
    await latestSummaryHeading.click();
    await expect(page.getByText(/1 memory hit/)).toBeVisible({
      timeout: 45_000
    });
  });

  test("keeps open-ended summary questions grounded without turning them into a rigid fact dump", async ({
    page,
    request
  }) => {
    const seedThreadResponse = await request.post("/api/test/smoke-create-thread", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        agentName: "Smoke Memory Coach"
      }
    });

    expect(seedThreadResponse.ok()).toBeTruthy();
    const { threadId: seedThreadId } = (await seedThreadResponse.json()) as {
      threadId: string;
    };

    for (const content of [
      "I am a product designer.",
      "以后我叫你小芳可以吗？",
      "以后你叫我阿强可以吗？"
    ]) {
      const seedTurnResponse = await request.post("/api/test/smoke-send-turn", {
        headers: {
          "x-smoke-secret": smokeSecret,
          "Content-Type": "application/json"
        },
        data: {
          threadId: seedThreadId,
          content
        }
      });

      expect(seedTurnResponse.ok()).toBeTruthy();
    }

    const summaryThreadResponse = await request.post("/api/test/smoke-create-thread", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        agentName: "Smoke Memory Coach"
      }
    });

    expect(summaryThreadResponse.ok()).toBeTruthy();
    const { threadId: summaryThreadId } = (await summaryThreadResponse.json()) as {
      threadId: string;
    };

    await page.goto(
      `/api/test/smoke-login?secret=${smokeSecret}&redirect=/chat?thread=${summaryThreadId}`
    );

    const summaryTurnResponse = await request.post("/api/test/smoke-send-turn", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        threadId: summaryThreadId,
        content: "简单总结一下你对我的了解。"
      }
    });

    expect(summaryTurnResponse.ok()).toBeTruthy();
    await page.reload();

    const latestAssistantReply = page
      .locator("article")
      .filter({ hasText: "Assistant" })
      .last();

    await expect(latestAssistantReply).toContainText("阿强", { timeout: 45_000 });
    await expect(latestAssistantReply).toContainText("产品设计师");
    await expect(latestAssistantReply).toContainText("小芳");
    await expect(latestAssistantReply).not.toContainText(/我不知道|I don't know/i);

    const latestAssistantMessage = await getLatestAssistantMessageForThread(
      summaryThreadId
    );
    const metadata = latestAssistantMessage.metadata;
    const recalledMemories = Array.isArray(metadata.recalled_memories)
      ? metadata.recalled_memories
      : [];
    const recalledMemoryTypes = recalledMemories
      .map((memory) =>
        typeof memory === "object" && memory !== null
          ? (memory as Record<string, unknown>).memory_type
          : null
      )
      .filter((value): value is string => typeof value === "string");

    expect(metadata.question_type).toBe("open-ended-summary");
    expect(metadata.answer_strategy).toBe("grounded-open-ended-summary");
    expect(metadata.answer_strategy_reason_code).toBe("open-ended-summary-prompt");
    expect(metadata.memory_used).toBe(true);
    expect(recalledMemoryTypes).toEqual(
      expect.arrayContaining(["profile", "relationship"])
    );
  });

  test("recalls agent nickname for the same agent without leaking it to other agents", async ({
    page,
    request
  }) => {
    const nicknameSeedThread = await request.post("/api/test/smoke-create-thread", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        agentName: "Smoke Memory Coach"
      }
    });

    expect(nicknameSeedThread.ok()).toBeTruthy();
    const { threadId: seedThreadId } = (await nicknameSeedThread.json()) as {
      threadId: string;
    };

    const seedNicknameTurn = await request.post("/api/test/smoke-send-turn", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        threadId: seedThreadId,
        content: "以后我叫你小芳可以吗？"
      }
    });

    expect(seedNicknameTurn.ok()).toBeTruthy();

    const sameAgentThread = await request.post("/api/test/smoke-create-thread", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        agentName: "Smoke Memory Coach"
      }
    });

    expect(sameAgentThread.ok()).toBeTruthy();
    const { threadId: sameAgentThreadId } = (await sameAgentThread.json()) as {
      threadId: string;
    };

    await page.goto(
      `/api/test/smoke-login?secret=${smokeSecret}&redirect=/chat?thread=${sameAgentThreadId}`
    );

    const sameAgentRecallTurn = await request.post("/api/test/smoke-send-turn", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        threadId: sameAgentThreadId,
        content: "你叫什么？"
      }
    });

    expect(sameAgentRecallTurn.ok()).toBeTruthy();
    await page.reload();

    await expect(page.getByText("哈哈，我叫小芳！").first()).toBeVisible({
      timeout: 45_000
    });

    const latestSummaryHeading = getLatestRuntimeSummaryHeading(page);
    await latestSummaryHeading.click();
    await expect(page.getByText(relationshipMemoryReasonPattern)).toBeVisible({
      timeout: 45_000
    });

    const differentAgentThread = await request.post("/api/test/smoke-create-thread", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        agentName: "Smoke Guide"
      }
    });

    expect(differentAgentThread.ok()).toBeTruthy();
    const { threadId: differentAgentThreadId } =
      (await differentAgentThread.json()) as {
        threadId: string;
      };

    await page.goto(
      `/api/test/smoke-login?secret=${smokeSecret}&redirect=/chat?thread=${differentAgentThreadId}`
    );

    const differentAgentRecallTurn = await request.post(
      "/api/test/smoke-send-turn",
      {
        headers: {
          "x-smoke-secret": smokeSecret,
          "Content-Type": "application/json"
        },
        data: {
          threadId: differentAgentThreadId,
          content: "你叫什么？"
        }
      }
    );

    expect(differentAgentRecallTurn.ok()).toBeTruthy();
    await page.reload();

    await expect(page.getByText("我叫Smoke Guide。").first()).toBeVisible({
      timeout: 45_000
    });
  });

  test("applies incorrect and restore predictably for relationship nickname memory", async ({
    page,
    request
  }) => {
    const nicknameSeedThread = await request.post("/api/test/smoke-create-thread", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        agentName: "Smoke Memory Coach"
      }
    });

    expect(nicknameSeedThread.ok()).toBeTruthy();
    const { threadId: seedThreadId } = (await nicknameSeedThread.json()) as {
      threadId: string;
    };

    const seedNicknameTurn = await request.post("/api/test/smoke-send-turn", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        threadId: seedThreadId,
        content: "以后我叫你小芳可以吗？"
      }
    });

    expect(seedNicknameTurn.ok()).toBeTruthy();

    await page.goto(
      `/api/test/smoke-login?secret=${smokeSecret}&redirect=/chat?thread=${seedThreadId}`
    );

    const visibleMemoryCards = page.locator(
      ".memory-list .memory-card:not(.memory-card-hidden)"
    );
    const nicknameMemoryCard = visibleMemoryCards
      .filter({
        has: page.locator(".memory-content", { hasText: /^小芳$/ })
      })
      .first();

    await expect(nicknameMemoryCard).toBeVisible({ timeout: 45_000 });
    await nicknameMemoryCard.getByRole("button", { name: "Incorrect" }).click();
    await page.getByText(/Incorrect memories \(1\)/).click();
    await expect(
      page
        .locator(".memory-card-hidden")
        .filter({ hasText: "小芳" })
        .first()
    ).toBeVisible({ timeout: 45_000 });

    const sameAgentFallbackThread = await request.post(
      "/api/test/smoke-create-thread",
      {
        headers: {
          "x-smoke-secret": smokeSecret,
          "Content-Type": "application/json"
        },
        data: {
          agentName: "Smoke Memory Coach"
        }
      }
    );

    expect(sameAgentFallbackThread.ok()).toBeTruthy();
    const { threadId: fallbackThreadId } =
      (await sameAgentFallbackThread.json()) as { threadId: string };

    await page.goto(
      `/api/test/smoke-login?secret=${smokeSecret}&redirect=/chat?thread=${fallbackThreadId}`
    );

    const fallbackRecallTurn = await request.post("/api/test/smoke-send-turn", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        threadId: fallbackThreadId,
        content: "你叫什么？"
      }
    });

    expect(fallbackRecallTurn.ok()).toBeTruthy();
    await page.reload();
    await expect(page.getByText("我叫Smoke Memory Coach。").first()).toBeVisible({
      timeout: 45_000
    });

    await page.goto(
      `/api/test/smoke-login?secret=${smokeSecret}&redirect=/chat?thread=${seedThreadId}`
    );
    await page.getByText(/Incorrect memories \(1\)/).click();
    const incorrectNicknameCard = page
      .locator(".memory-card-hidden")
      .filter({ hasText: "小芳" })
      .first();
    await incorrectNicknameCard.getByRole("button", { name: "Restore" }).click();

    const restoredSameAgentThread = await request.post(
      "/api/test/smoke-create-thread",
      {
        headers: {
          "x-smoke-secret": smokeSecret,
          "Content-Type": "application/json"
        },
        data: {
          agentName: "Smoke Memory Coach"
        }
      }
    );

    expect(restoredSameAgentThread.ok()).toBeTruthy();
    const { threadId: restoredThreadId } =
      (await restoredSameAgentThread.json()) as { threadId: string };

    await page.goto(
      `/api/test/smoke-login?secret=${smokeSecret}&redirect=/chat?thread=${restoredThreadId}`
    );

    const restoredRecallTurn = await request.post("/api/test/smoke-send-turn", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        threadId: restoredThreadId,
        content: "你叫什么？"
      }
    });

    expect(restoredRecallTurn.ok()).toBeTruthy();
    await page.reload();
    await expect(page.getByText("哈哈，我叫小芳！").first()).toBeVisible({
      timeout: 45_000
    });
  });

  test("recalls the user's preferred name for the same agent without leaking it to other agents", async ({
    page,
    request
  }) => {
    const preferredNameSeedThread = await request.post(
      "/api/test/smoke-create-thread",
      {
        headers: {
          "x-smoke-secret": smokeSecret,
          "Content-Type": "application/json"
        },
        data: {
          agentName: "Smoke Memory Coach"
        }
      }
    );

    expect(preferredNameSeedThread.ok()).toBeTruthy();
    const { threadId: seedThreadId } =
      (await preferredNameSeedThread.json()) as { threadId: string };

    const seedPreferredNameTurn = await request.post(
      "/api/test/smoke-send-turn",
      {
        headers: {
          "x-smoke-secret": smokeSecret,
          "Content-Type": "application/json"
        },
        data: {
          threadId: seedThreadId,
          content: "以后你叫我阿强可以吗？"
        }
      }
    );

    expect(seedPreferredNameTurn.ok()).toBeTruthy();

    const sameAgentThread = await request.post("/api/test/smoke-create-thread", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        agentName: "Smoke Memory Coach"
      }
    });

    expect(sameAgentThread.ok()).toBeTruthy();
    const { threadId: sameAgentThreadId } = (await sameAgentThread.json()) as {
      threadId: string;
    };

    await page.goto(
      `/api/test/smoke-login?secret=${smokeSecret}&redirect=/chat?thread=${sameAgentThreadId}`
    );

    const sameAgentRecallTurn = await request.post("/api/test/smoke-send-turn", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        threadId: sameAgentThreadId,
        content: "你该怎么叫我？"
      }
    });

    expect(sameAgentRecallTurn.ok()).toBeTruthy();
    await page.reload();

    await expect(page.getByText("我应该叫你阿强。").first()).toBeVisible({
      timeout: 45_000
    });

    const latestSummaryHeading = getLatestRuntimeSummaryHeading(page);
    await latestSummaryHeading.click();
    await expect(page.getByText(relationshipMemoryReasonPattern)).toBeVisible({
      timeout: 45_000
    });

    const differentAgentThread = await request.post("/api/test/smoke-create-thread", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        agentName: "Smoke Guide"
      }
    });

    expect(differentAgentThread.ok()).toBeTruthy();
    const { threadId: differentAgentThreadId } =
      (await differentAgentThread.json()) as { threadId: string };

    await page.goto(
      `/api/test/smoke-login?secret=${smokeSecret}&redirect=/chat?thread=${differentAgentThreadId}`
    );

    const differentAgentRecallTurn = await request.post(
      "/api/test/smoke-send-turn",
      {
        headers: {
          "x-smoke-secret": smokeSecret,
          "Content-Type": "application/json"
        },
        data: {
          threadId: differentAgentThreadId,
          content: "你该怎么叫我？"
        }
      }
    );

    expect(differentAgentRecallTurn.ok()).toBeTruthy();
    await page.reload();

    await expect(page.getByText("我还没有记住你偏好的称呼。").first()).toBeVisible({
      timeout: 45_000
    });
  });

  test("makes relationship recall visible in self-introduction style", async ({
    page,
    request
  }) => {
    const relationshipSeedThread = await request.post(
      "/api/test/smoke-create-thread",
      {
        headers: {
          "x-smoke-secret": smokeSecret,
          "Content-Type": "application/json"
        },
        data: {
          agentName: "Smoke Memory Coach"
        }
      }
    );

    expect(relationshipSeedThread.ok()).toBeTruthy();
    const { threadId: seedThreadId } =
      (await relationshipSeedThread.json()) as { threadId: string };

    const nicknameTurn = await request.post("/api/test/smoke-send-turn", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        threadId: seedThreadId,
        content: "以后我叫你小芳可以吗？"
      }
    });
    expect(nicknameTurn.ok()).toBeTruthy();

    const preferredNameTurn = await request.post("/api/test/smoke-send-turn", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        threadId: seedThreadId,
        content: "以后你叫我阿强可以吗？"
      }
    });
    expect(preferredNameTurn.ok()).toBeTruthy();

    const styleTurn = await request.post("/api/test/smoke-send-turn", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        threadId: seedThreadId,
        content: "以后和我说话轻松一点，可以吗？"
      }
    });
    expect(styleTurn.ok()).toBeTruthy();

    const sameAgentThread = await request.post("/api/test/smoke-create-thread", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        agentName: "Smoke Memory Coach"
      }
    });

    expect(sameAgentThread.ok()).toBeTruthy();
    const { threadId: sameAgentThreadId } = (await sameAgentThread.json()) as {
      threadId: string;
    };

    await page.goto(
      `/api/test/smoke-login?secret=${smokeSecret}&redirect=/chat?thread=${sameAgentThreadId}`
    );

    const introTurn = await request.post("/api/test/smoke-send-turn", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        threadId: sameAgentThreadId,
        content: "请简单介绍一下你自己。"
      }
    });

    expect(introTurn.ok()).toBeTruthy();
    await page.reload();

    await expect(page.getByText("嗨，阿强。 我是小芳，很高兴继续和你聊。").first()).toBeVisible({
      timeout: 45_000
    });

    const latestSummaryHeading = getLatestRuntimeSummaryHeading(page);
    await latestSummaryHeading.click();
    await expect(page.getByText(relationshipMemoryReasonPattern)).toBeVisible({
      timeout: 45_000
    });
  });

  test("keeps user address style scoped to the same agent", async ({
    page,
    request
  }) => {
    const styleSeedThread = await request.post("/api/test/smoke-create-thread", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        agentName: "Smoke Memory Coach"
      }
    });

    expect(styleSeedThread.ok()).toBeTruthy();
    const { threadId: seedThreadId } = (await styleSeedThread.json()) as {
      threadId: string;
    };

    const seedStyleTurn = await request.post("/api/test/smoke-send-turn", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        threadId: seedThreadId,
        content: "以后和我说话轻松一点，可以吗？"
      }
    });

    expect(seedStyleTurn.ok()).toBeTruthy();

    const sameAgentThread = await request.post("/api/test/smoke-create-thread", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        agentName: "Smoke Memory Coach"
      }
    });

    expect(sameAgentThread.ok()).toBeTruthy();
    const { threadId: sameAgentThreadId } = (await sameAgentThread.json()) as {
      threadId: string;
    };

    await page.goto(
      `/api/test/smoke-login?secret=${smokeSecret}&redirect=/chat?thread=${sameAgentThreadId}`
    );

    const sameAgentGreetingTurn = await request.post("/api/test/smoke-send-turn", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        threadId: sameAgentThreadId,
        content: "请简单和我打个招呼。"
      }
    });

    expect(sameAgentGreetingTurn.ok()).toBeTruthy();
    await page.reload();

    await expect(page.getByText("嗨，很高兴继续和你聊。").first()).toBeVisible({
      timeout: 45_000
    });

    const differentAgentThread = await request.post("/api/test/smoke-create-thread", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        agentName: "Smoke Guide"
      }
    });

    expect(differentAgentThread.ok()).toBeTruthy();
    const { threadId: differentAgentThreadId } =
      (await differentAgentThread.json()) as { threadId: string };

    await page.goto(
      `/api/test/smoke-login?secret=${smokeSecret}&redirect=/chat?thread=${differentAgentThreadId}`
    );

    const differentAgentGreetingTurn = await request.post(
      "/api/test/smoke-send-turn",
      {
        headers: {
          "x-smoke-secret": smokeSecret,
          "Content-Type": "application/json"
        },
        data: {
          threadId: differentAgentThreadId,
          content: "请简单和我打个招呼。"
        }
      }
    );

    expect(differentAgentGreetingTurn.ok()).toBeTruthy();
    await page.reload();

    await expect(page.getByText("你好，很高兴见到你。").first()).toBeVisible({
      timeout: 45_000
    });
  });

  test("grounds direct reply-style questions in remembered relationship style", async ({
    page,
    request
  }) => {
    const styleSeedThread = await request.post("/api/test/smoke-create-thread", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        agentName: "Smoke Memory Coach"
      }
    });

    expect(styleSeedThread.ok()).toBeTruthy();
    const { threadId: seedThreadId } = (await styleSeedThread.json()) as {
      threadId: string;
    };

    const seedStyleTurn = await request.post("/api/test/smoke-send-turn", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        threadId: seedThreadId,
        content: "以后和我说话轻松一点，可以吗？"
      }
    });

    expect(seedStyleTurn.ok()).toBeTruthy();

    const sameAgentThread = await request.post("/api/test/smoke-create-thread", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        agentName: "Smoke Memory Coach"
      }
    });

    expect(sameAgentThread.ok()).toBeTruthy();
    const { threadId: sameAgentThreadId } = (await sameAgentThread.json()) as {
      threadId: string;
    };

    await page.goto(
      `/api/test/smoke-login?secret=${smokeSecret}&redirect=/chat?thread=${sameAgentThreadId}`
    );

    const directStyleTurn = await request.post("/api/test/smoke-send-turn", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        threadId: sameAgentThreadId,
        content: "我喜欢什么样的回复方式？如果你不知道，就直接说不知道。"
      }
    });

    expect(directStyleTurn.ok()).toBeTruthy();
    await page.reload();

    await expect(
      page.getByText("你偏好我用更轻松、不那么正式的方式回复你。").first()
    ).toBeVisible({ timeout: 45_000 });

    const latestSummaryHeading = getLatestRuntimeSummaryHeading(page);
    await latestSummaryHeading.click();
    await expect(page.getByText(relationshipMemoryReasonPattern)).toBeVisible({
      timeout: 45_000
    });
  });

  test("keeps the default explanation UI focused on one main reason", async ({
    page,
    request
  }) => {
    const styleSeedThread = await request.post("/api/test/smoke-create-thread", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        agentName: "Smoke Memory Coach"
      }
    });

    expect(styleSeedThread.ok()).toBeTruthy();
    const { threadId: seedThreadId } = (await styleSeedThread.json()) as {
      threadId: string;
    };

    const seedStyleTurn = await request.post("/api/test/smoke-send-turn", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        threadId: seedThreadId,
        content: "以后和我说话轻松一点，可以吗？"
      }
    });

    expect(seedStyleTurn.ok()).toBeTruthy();

    const sameAgentThread = await request.post("/api/test/smoke-create-thread", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        agentName: "Smoke Memory Coach"
      }
    });

    expect(sameAgentThread.ok()).toBeTruthy();
    const { threadId } = (await sameAgentThread.json()) as {
      threadId: string;
    };

    await page.goto(
      `/api/test/smoke-login?secret=${smokeSecret}&redirect=/chat?thread=${threadId}`
    );

    const directStyleTurn = await request.post("/api/test/smoke-send-turn", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        threadId,
        content: "我喜欢什么样的回复方式？如果你不知道，就直接说不知道。"
      }
    });

    expect(directStyleTurn.ok()).toBeTruthy();
    await page.reload();

    const latestSummaryHeading = getLatestRuntimeSummaryHeading(page);
    await expect(latestSummaryHeading).toHaveText(/Main reason|Why this turn/);
    await latestSummaryHeading.click();

    const latestSummary = page.locator(".runtime-summary").last();
    await expect(
      latestSummary.getByText(
        /Mainly shaped by memory\.|Mainly shaped by the current profile\.|Mainly shaped by memory and the current profile\./
      )
    ).toBeVisible({ timeout: 45_000 });
    await expect(latestSummary.locator(".runtime-summary-reason")).toHaveCount(1);
    await expect(latestSummary).not.toContainText(developerDiagnosticsLeakPattern);
  });

  test("keeps same-thread relationship style and language continuity on short follow-ups", async ({
    page,
    request
  }) => {
    const createThreadResponse = await request.post("/api/test/smoke-create-thread", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        agentName: "Smoke Memory Coach"
      }
    });

    expect(createThreadResponse.ok()).toBeTruthy();
    const { threadId } = (await createThreadResponse.json()) as { threadId: string };

    await page.goto(
      `/api/test/smoke-login?secret=${smokeSecret}&redirect=/chat?thread=${threadId}`
    );

    const preferredNameTurn = await request.post("/api/test/smoke-send-turn", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        threadId,
        content: "以后你叫我阿强可以吗？"
      }
    });
    expect(preferredNameTurn.ok()).toBeTruthy();

    const nicknameTurn = await request.post("/api/test/smoke-send-turn", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        threadId,
        content: "以后我叫你小芳可以吗？"
      }
    });
    expect(nicknameTurn.ok()).toBeTruthy();

    const styleTurn = await request.post("/api/test/smoke-send-turn", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        threadId,
        content: "以后和我说话轻松一点，可以吗？"
      }
    });
    expect(styleTurn.ok()).toBeTruthy();

    const introTurn = await request.post("/api/test/smoke-send-turn", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        threadId,
        content: "请简单介绍一下你自己。"
      }
    });
    expect(introTurn.ok()).toBeTruthy();

    const shortFollowUpTurn = await request.post("/api/test/smoke-send-turn", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        threadId,
        content: "👍"
      }
    });
    expect(shortFollowUpTurn.ok()).toBeTruthy();
    const shortFollowUpAssistant = await getLatestAssistantMessageForThread(threadId);
    expect(shortFollowUpAssistant.metadata.answer_strategy).toBe(
      "same-thread-continuation"
    );
    expect(shortFollowUpAssistant.metadata.continuation_reason_code).toBe(
      "short-fuzzy-follow-up"
    );

    const secondIntroTurn = await request.post("/api/test/smoke-send-turn", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        threadId,
        content: "再简单介绍一下你自己。"
      }
    });
    expect(secondIntroTurn.ok()).toBeTruthy();
    const secondIntroAssistant = await getLatestAssistantMessageForThread(threadId);
    expect(secondIntroAssistant.metadata.answer_strategy).toBe(
      "same-thread-continuation"
    );
    expect(secondIntroAssistant.metadata.continuation_reason_code).toBe(
      "brief-summary-carryover"
    );
    expect(secondIntroAssistant.content).toContain("阿强");

    const explanatoryTurn = await request.post("/api/test/smoke-send-turn", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        threadId,
        content: "如果我今天状态不太好，你会怎么和我说？"
      }
    });
    expect(explanatoryTurn.ok()).toBeTruthy();

    const closingTurn = await request.post("/api/test/smoke-send-turn", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        threadId,
        content: "那你再简单鼓励我一句。"
      }
    });
    expect(closingTurn.ok()).toBeTruthy();
    const closingAssistant = await getLatestAssistantMessageForThread(threadId);
    expect(closingAssistant.metadata.answer_strategy).toBe(
      "same-thread-continuation"
    );
    expect(closingAssistant.metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(closingAssistant.content).toContain("阿强");

    await page.reload();

    await expect(page.getByText("好呀，阿强，我们继续。").first()).toBeVisible({
      timeout: 45_000
    });
    await expect(
      page.getByText("嗨，阿强。 我是小芳，很高兴继续和你聊。").first()
    ).toBeVisible({
      timeout: 45_000
    });
    await expect(
      page
        .getByText("阿强，如果你今天状态不太好，我会先轻松一点陪你把事情捋顺，再和你一起往前推。")
        .first()
    ).toBeVisible({
      timeout: 45_000
    });
    await expect(
      page.getByText("阿强，别急，我在呢。").first()
    ).toBeVisible({
      timeout: 45_000
    });
  });

  test("prefers same-thread continuation before distant memory fallback on fuzzy follow-ups", async ({
    request
  }) => {
    const admin = getSmokeAdminClient();

    const seedThreadResponse = await request.post("/api/test/smoke-create-thread", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        agentName: "Smoke Memory Coach"
      }
    });

    expect(seedThreadResponse.ok()).toBeTruthy();
    const { threadId: seedThreadId } = (await seedThreadResponse.json()) as {
      threadId: string;
    };

    const seedMemoryResponse = await request.post("/api/test/smoke-send-turn", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        threadId: seedThreadId,
        content: "I am a product designer."
      }
    });
    expect(seedMemoryResponse.ok()).toBeTruthy();

    const createThreadResponse = await request.post("/api/test/smoke-create-thread", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        agentName: "Smoke Memory Coach"
      }
    });

    expect(createThreadResponse.ok()).toBeTruthy();
    const { threadId } = (await createThreadResponse.json()) as { threadId: string };

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后我叫你小芳可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "请简单介绍一下你自己。"
    ]) {
      const response = await request.post("/api/test/smoke-send-turn", {
        headers: {
          "x-smoke-secret": smokeSecret,
          "Content-Type": "application/json"
        },
        data: {
          threadId,
          content
        }
      });

      expect(response.ok()).toBeTruthy();
    }

    const followUpResponse = await request.post("/api/test/smoke-send-turn", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        threadId,
        content: "那接下来呢？"
      }
    });

    expect(followUpResponse.ok()).toBeTruthy();

    const { data: latestAssistantMessage, error } = await admin
      .from("messages")
      .select("content, metadata")
      .eq("thread_id", threadId)
      .eq("role", "assistant")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    expect(error).toBeNull();
    expect(latestAssistantMessage).toBeTruthy();

    const metadata = latestAssistantMessage?.metadata as Record<string, unknown>;
    const recalledMemories = Array.isArray(metadata?.recalled_memories)
      ? metadata.recalled_memories
      : [];
    const recalledMemoryTypes = recalledMemories
      .map((memory) =>
        typeof memory === "object" && memory !== null
          ? (memory as Record<string, unknown>).memory_type
          : null
      )
      .filter((value): value is string => typeof value === "string");
    const recalledMemoryContents = recalledMemories
      .map((memory) =>
        typeof memory === "object" && memory !== null
          ? (memory as Record<string, unknown>).content
          : null
      )
      .filter((value): value is string => typeof value === "string");

    expect(latestAssistantMessage?.content).toContain("阿强");
    expect(metadata.answer_strategy).toBe("same-thread-continuation");
    expect(metadata.answer_strategy_reason_code).toBe(
      "same-thread-edge-carryover"
    );
    expect(metadata.continuation_reason_code).toBe("short-fuzzy-follow-up");
    expect(metadata.same_thread_continuation_preferred).toBe(true);
    expect(metadata.distant_memory_fallback_allowed).toBe(false);
    expect(recalledMemoryTypes).toEqual(
      expect.arrayContaining(["relationship"])
    );
    expect(recalledMemoryTypes).not.toContain("profile");
    expect(recalledMemoryContents.join(" ")).not.toContain("product designer");
  });

  test("covers memory correction controls and agent defaults/model profile changes", async ({
    page,
    request
  }) => {
    const createThreadResponse = await request.post("/api/test/smoke-create-thread", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        agentName: "Smoke Guide"
      }
    });

    expect(createThreadResponse.ok()).toBeTruthy();

    const createThreadPayload = (await createThreadResponse.json()) as {
      threadId: string;
    };

    await page.goto(
      `/api/test/smoke-login?secret=${smokeSecret}&redirect=/chat?thread=${createThreadPayload.threadId}`
    );
    await expect(page.getByLabel("Message")).toBeVisible();
    const seedMemoryResponse = await request.post("/api/test/smoke-send-turn", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        threadId: createThreadPayload.threadId,
        content: "I am a product designer and I prefer concise weekly planning."
      }
    });

    expect(seedMemoryResponse.ok()).toBeTruthy();
    await page.reload();

    const visibleMemoryCards = page.locator(
      ".memory-list .memory-card:not(.memory-card-hidden)"
    );

    const profileMemoryCard = visibleMemoryCards
      .filter({
        has: page.locator(".memory-content", { hasText: /^product designer$/ })
      })
      .first();

    await expect(profileMemoryCard).toBeVisible({ timeout: 45_000 });

    await profileMemoryCard.getByRole("button", { name: "Hide" }).click();
    await expect(page.getByText(/Hidden memories \(1\)/)).toBeVisible();
    await expect(
      visibleMemoryCards.filter({
        has: page.locator(".memory-content", { hasText: /^product designer$/ })
      })
    ).toHaveCount(0);

    await page.getByText(/Hidden memories \(1\)/).click();

    const hiddenMemoryCard = page
      .locator(".memory-card-hidden")
      .filter({ hasText: "product designer" })
      .first();

    await hiddenMemoryCard.getByRole("button", { name: "Restore" }).click();
    await expect(
      visibleMemoryCards
        .filter({
          has: page.locator(".memory-content", { hasText: /^product designer$/ })
        })
        .first()
    ).toBeVisible();

    const restoredMemoryCard = visibleMemoryCards
      .filter({
        has: page.locator(".memory-content", { hasText: /^product designer$/ })
      })
      .first();
    await restoredMemoryCard.getByRole("button", { name: "Incorrect" }).click();
    await page.getByText(/Incorrect memories \(1\)/).click();

    const incorrectMemoryCard = page
      .locator(".memory-card-hidden")
      .filter({ hasText: "product designer" })
      .first();
    await expect(incorrectMemoryCard).toBeVisible();
    await incorrectMemoryCard.getByRole("button", { name: "Restore" }).click();

    const memoryCoachCard = page
      .locator(".agent-card")
      .filter({ hasText: "Smoke Memory Coach" })
      .first();
    await memoryCoachCard.getByRole("button", { name: "Set as default" }).click();

    await expect(
      memoryCoachCard.getByRole("button", { name: "Default agent" })
    ).toBeVisible();

    const smokeGuideCard = page
      .locator(".agent-card")
      .filter({ hasText: "Smoke Guide" })
      .first();

    await smokeGuideCard.getByRole("button", { name: "Edit" }).click();
    const agentDialog = page.getByRole("dialog", {
      name: "Lightweight agent details"
    });
    const smokeAltValue = await page
      .getByLabel("Model profile")
      .locator("option")
      .filter({ hasText: "Smoke Alt" })
      .first()
      .getAttribute("value");

    expect(smokeAltValue).toBeTruthy();
    await agentDialog.getByLabel("Model profile").selectOption(smokeAltValue!);
    const saveChangesButton = agentDialog.getByRole("button", {
      name: "Save changes"
    });
    await saveChangesButton.scrollIntoViewIfNeeded();
    await saveChangesButton.evaluate((node: HTMLButtonElement) => node.click());

    await expect(smokeGuideCard.getByText(/Model profile: Smoke Alt/)).toBeVisible();

    const secondTurnResponse = await request.post("/api/test/smoke-send-turn", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        threadId: createThreadPayload.threadId,
        content: "Reply in one sentence with a quick hello."
      }
    });

    expect(secondTurnResponse.ok()).toBeTruthy();
    await page.reload();

    await expect(page.getByText("Smoke Alt").first()).toBeVisible({
      timeout: 45_000
    });
  });

  test("keeps reply language aligned with the latest user message", async ({
    page,
    request
  }) => {
    const createThreadResponse = await request.post("/api/test/smoke-create-thread", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        agentName: "Smoke Guide"
      }
    });

    expect(createThreadResponse.ok()).toBeTruthy();
    const { threadId } = (await createThreadResponse.json()) as { threadId: string };

    await page.goto(
      `/api/test/smoke-login?secret=${smokeSecret}&redirect=/chat?thread=${threadId}`
    );

    const zhTurnResponse = await request.post("/api/test/smoke-send-turn", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        threadId,
        content: "请用两句话介绍你自己，并说明你能如何帮助我。"
      }
    });

    expect(zhTurnResponse.ok()).toBeTruthy();
    await page.reload();
    await expect(page.getByText("可以用中文帮助你").first()).toBeVisible({
      timeout: 45_000
    });

    const enTurnResponse = await request.post("/api/test/smoke-send-turn", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        threadId,
        content:
          "Please introduce yourself in two short sentences and explain how you can help me."
      }
    });

    expect(enTurnResponse.ok()).toBeTruthy();
    await page.reload();
    await expect(page.getByText("I am SparkCore").first()).toBeVisible({
      timeout: 45_000
    });

    const switchBackResponse = await request.post("/api/test/smoke-send-turn", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        threadId,
        content: "现在请用中文再介绍一次你自己。"
      }
    });

    expect(switchBackResponse.ok()).toBeTruthy();
    await page.reload();
    await expect(page.getByText("我是 SparkCore").first()).toBeVisible({
      timeout: 45_000
    });
  });

  test("keeps Chinese as the reply language when recalled memory is in English", async ({
    page,
    request
  }) => {
    const seedThreadResponse = await request.post("/api/test/smoke-create-thread", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        agentName: "Smoke Guide"
      }
    });

    expect(seedThreadResponse.ok()).toBeTruthy();
    const { threadId } = (await seedThreadResponse.json()) as { threadId: string };

    await page.goto(
      `/api/test/smoke-login?secret=${smokeSecret}&redirect=/chat?thread=${threadId}`
    );

    const seedMemoryResponse = await request.post("/api/test/smoke-send-turn", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        threadId,
        content: "I am a product designer and I prefer concise weekly planning."
      }
    });

    expect(seedMemoryResponse.ok()).toBeTruthy();

    const zhRecallResponse = await request.post("/api/test/smoke-send-turn", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        threadId,
        content: "你记得我做什么工作吗？"
      }
    });

    expect(zhRecallResponse.ok()).toBeTruthy();
    await page.reload();

    await expect(page.getByText("我记得你是一名产品设计师。").first()).toBeVisible({
      timeout: 45_000
    });

    const latestAssistantMessage = await getLatestAssistantMessageForThread(
      threadId
    );
    const metadata = latestAssistantMessage.metadata;

    expect(metadata.reply_language_detected).toBe("zh-Hans");
    expect(metadata.answer_strategy).toBe("structured-recall-first");
    expect(metadata.answer_strategy_reason_code).toBe("direct-memory-question");
    expect(metadata.reply_language_source).toBe("latest-user-message");
  });

  test("keeps Chinese on short mixed-language follow-ups after an English memory seed", async ({
    request
  }) => {
    const seedThreadResponse = await request.post("/api/test/smoke-create-thread", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        agentName: "Smoke Guide"
      }
    });

    expect(seedThreadResponse.ok()).toBeTruthy();
    const { threadId } = (await seedThreadResponse.json()) as { threadId: string };

    for (const content of [
      "I am a product designer and I prefer concise weekly planning.",
      "你记得我做什么工作吗？",
      "那接下来呢？"
    ]) {
      const response = await request.post("/api/test/smoke-send-turn", {
        headers: {
          "x-smoke-secret": smokeSecret,
          "Content-Type": "application/json"
        },
        data: {
          threadId,
          content
        }
      });

      expect(response.ok()).toBeTruthy();
    }

    const latestAssistantMessage = await getLatestAssistantMessageForThread(
      threadId
    );
    const metadata = latestAssistantMessage.metadata;

    expect(metadata.answer_strategy).toBe("same-thread-continuation");
    expect(metadata.answer_strategy_reason_code).toBe(
      "same-thread-edge-carryover"
    );
    expect(metadata.continuation_reason_code).toBe("short-fuzzy-follow-up");
    expect(metadata.same_thread_continuation_preferred).toBe(true);
    expect(metadata.distant_memory_fallback_allowed).toBe(false);
    expect(metadata.reply_language_detected).toBe("zh-Hans");
    expect(metadata.reply_language_source).toBe("latest-user-message");
    expect(latestAssistantMessage.content).toMatch(/[一-龥]/u);
    expect(latestAssistantMessage.content).not.toMatch(/\bproduct designer\b/i);
  });

  test("uses thread continuity as the language source for ambiguous short follow-ups", async ({
    request
  }) => {
    const createThreadResponse = await request.post("/api/test/smoke-create-thread", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        agentName: "Smoke Guide"
      }
    });

    expect(createThreadResponse.ok()).toBeTruthy();
    const { threadId } = (await createThreadResponse.json()) as { threadId: string };

    const introTurn = await request.post("/api/test/smoke-send-turn", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        threadId,
        content:
          "Please introduce yourself in two short sentences and explain how you can help me."
      }
    });
    expect(introTurn.ok()).toBeTruthy();

    const followUpTurn = await request.post("/api/test/smoke-send-turn", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        threadId,
        content: "👍"
      }
    });
    expect(followUpTurn.ok()).toBeTruthy();

    const latestAssistantMessage = await getLatestAssistantMessageForThread(
      threadId
    );
    const metadata = latestAssistantMessage.metadata;

    expect(metadata.answer_strategy).toBe("same-thread-continuation");
    expect(metadata.answer_strategy_reason_code).toBe(
      "same-thread-edge-carryover"
    );
    expect(metadata.continuation_reason_code).toBe("short-fuzzy-follow-up");
    expect(metadata.reply_language_source).toBe("thread-continuity-fallback");
    expect(metadata.reply_language_detected).toBe("en");
  });

  test("uses relationship-answer-shape diagnostics for explanatory turns before same-thread carryover exists", async ({
    request
  }) => {
    const seedThreadResponse = await request.post("/api/test/smoke-create-thread", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        agentName: "Smoke Memory Coach"
      }
    });

    expect(seedThreadResponse.ok()).toBeTruthy();
    const { threadId: seedThreadId } = (await seedThreadResponse.json()) as {
      threadId: string;
    };

    const seedStyleTurn = await request.post("/api/test/smoke-send-turn", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        threadId: seedThreadId,
        content: "以后和我说话轻松一点，可以吗？"
      }
    });
    expect(seedStyleTurn.ok()).toBeTruthy();

    const createThreadResponse = await request.post("/api/test/smoke-create-thread", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        agentName: "Smoke Memory Coach"
      }
    });

    expect(createThreadResponse.ok()).toBeTruthy();
    const { threadId } = (await createThreadResponse.json()) as { threadId: string };

    const explanatoryTurn = await request.post("/api/test/smoke-send-turn", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        threadId,
        content: "如果我今天状态不太好，你会怎么和我说？"
      }
    });
    expect(explanatoryTurn.ok()).toBeTruthy();

    const latestAssistantMessage = await getLatestAssistantMessageForThread(
      threadId
    );
    const metadata = latestAssistantMessage.metadata;

    expect(metadata.question_type).toBe("open-ended-summary");
    expect(metadata.answer_strategy).toBe("grounded-open-ended-summary");
    expect(metadata.answer_strategy_reason_code).toBe(
      "relationship-answer-shape-prompt"
    );
    expect(metadata.same_thread_continuation_preferred).toBe(false);
    expect(metadata.continuation_reason_code).toBeNull();
  });
});
