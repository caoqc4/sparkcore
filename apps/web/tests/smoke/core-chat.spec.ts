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

async function getSmokeAgentByName(name: string) {
  const admin = getSmokeAdminClient();
  const { data, error } = await admin
    .from("agents")
    .select("id, name, default_model_profile_id")
    .eq("name", name)
    .eq("status", "active")
    .maybeSingle();

  expect(error).toBeNull();
  expect(data).toBeTruthy();

  return data as {
    id: string;
    name: string;
    default_model_profile_id: string | null;
  };
}

async function getSmokeModelProfileBySlug(slug: string) {
  const admin = getSmokeAdminClient();
  const { data, error } = await admin
    .from("model_profiles")
    .select("id, slug, name")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  expect(error).toBeNull();
  expect(data).toBeTruthy();

  return data as {
    id: string;
    slug: string;
    name: string;
  };
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

async function getAssistantMessagesForThread(threadId: string) {
  const admin = getSmokeAdminClient();
  const { data, error } = await admin
    .from("messages")
    .select("content, metadata")
    .eq("thread_id", threadId)
    .eq("role", "assistant")
    .order("created_at", { ascending: true });

  expect(error).toBeNull();
  expect(data).toBeTruthy();

  return data as Array<{
    content: string;
    metadata: Record<string, unknown>;
  }>;
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

  test("keeps correction-aftermath metadata stable for relationship nickname recall", async ({
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

    const fallbackThread = await request.post("/api/test/smoke-create-thread", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        agentName: "Smoke Memory Coach"
      }
    });

    expect(fallbackThread.ok()).toBeTruthy();
    const { threadId: fallbackThreadId } = (await fallbackThread.json()) as {
      threadId: string;
    };

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

    const fallbackAssistantMessage = await getLatestAssistantMessageForThread(
      fallbackThreadId
    );
    const fallbackMetadata = fallbackAssistantMessage.metadata;
    const fallbackRecalledMemories = Array.isArray(
      fallbackMetadata.recalled_memories
    )
      ? fallbackMetadata.recalled_memories
      : [];

    expect(fallbackMetadata.question_type).toBe(
      "direct-relationship-confirmation"
    );
    expect(fallbackMetadata.answer_strategy).toBe("relationship-recall-first");
    expect(fallbackMetadata.answer_strategy_reason_code).toBe(
      "direct-relationship-question"
    );
    expect(fallbackMetadata.memory_hit_count).toBe(0);
    expect(fallbackMetadata.memory_used).toBe(false);
    expect(fallbackMetadata.incorrect_memory_exclusion_count).toBe(1);
    expect(fallbackRecalledMemories).toHaveLength(0);
    expect(fallbackAssistantMessage.content).toBe("我叫Smoke Memory Coach。");

    await page.goto(
      `/api/test/smoke-login?secret=${smokeSecret}&redirect=/chat?thread=${seedThreadId}`
    );
    await page.getByText(/Incorrect memories \(1\)/).click();
    const incorrectNicknameCard = page
      .locator(".memory-card-hidden")
      .filter({ hasText: "小芳" })
      .first();
    await incorrectNicknameCard.getByRole("button", { name: "Restore" }).click();

    const restoredThread = await request.post("/api/test/smoke-create-thread", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        agentName: "Smoke Memory Coach"
      }
    });

    expect(restoredThread.ok()).toBeTruthy();
    const { threadId: restoredThreadId } = (await restoredThread.json()) as {
      threadId: string;
    };

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

    const restoredAssistantMessage = await getLatestAssistantMessageForThread(
      restoredThreadId
    );
    const restoredMetadata = restoredAssistantMessage.metadata;
    const restoredRecalledMemories = Array.isArray(
      restoredMetadata.recalled_memories
    )
      ? restoredMetadata.recalled_memories
      : [];

    expect(restoredMetadata.question_type).toBe(
      "direct-relationship-confirmation"
    );
    expect(restoredMetadata.answer_strategy).toBe("relationship-recall-first");
    expect(restoredMetadata.answer_strategy_reason_code).toBe(
      "direct-relationship-question"
    );
    expect(restoredMetadata.memory_hit_count).toBe(1);
    expect(restoredMetadata.memory_used).toBe(true);
    expect(restoredMetadata.incorrect_memory_exclusion_count).toBe(0);
    expect(restoredRecalledMemories).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          memory_type: "relationship",
          content: "小芳"
        })
      ])
    );
    expect(restoredAssistantMessage.content).toBe("哈哈，我叫小芳！");
  });

  test("restore reclaims the active single-slot memory and supersedes later overrides", async ({
    page,
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

    const seedNicknameResponse = await request.post("/api/test/smoke-send-turn", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        threadId: seedThreadId,
        content: "以后我叫你小芳可以吗？"
      }
    });

    expect(seedNicknameResponse.ok()).toBeTruthy();

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

    const overrideThreadResponse = await request.post("/api/test/smoke-create-thread", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        agentName: "Smoke Memory Coach"
      }
    });

    expect(overrideThreadResponse.ok()).toBeTruthy();
    const { threadId: overrideThreadId } = (await overrideThreadResponse.json()) as {
      threadId: string;
    };

    const overrideNicknameResponse = await request.post("/api/test/smoke-send-turn", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        threadId: overrideThreadId,
        content: "以后我叫你阿花可以吗？"
      }
    });

    expect(overrideNicknameResponse.ok()).toBeTruthy();

    const overrideRecallResponse = await request.post("/api/test/smoke-send-turn", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        threadId: overrideThreadId,
        content: "你叫什么？"
      }
    });

    expect(overrideRecallResponse.ok()).toBeTruthy();
    const overrideAssistantMessage = await getLatestAssistantMessageForThread(
      overrideThreadId
    );
    expect(overrideAssistantMessage.content).toBe("哈哈，我叫阿花！");

    await page.goto(
      `/api/test/smoke-login?secret=${smokeSecret}&redirect=/chat?thread=${seedThreadId}`
    );
    await page.getByText(/Incorrect memories \(1\)/).click();
    const incorrectNicknameCard = page
      .locator(".memory-card-hidden")
      .filter({ hasText: "小芳" })
      .first();
    await incorrectNicknameCard.getByRole("button", { name: "Restore" }).click();
    await expect(
      visibleMemoryCards
        .filter({
          has: page.locator(".memory-content", { hasText: /^小芳$/ })
        })
        .first()
    ).toBeVisible({ timeout: 45_000 });

    const smokeAgent = await getSmokeAgentByName("Smoke Memory Coach");
    const { data: nicknameRowsAfterRestore, error: nicknameRowsAfterRestoreError } =
      await admin
        .from("memory_items")
        .select("content, status")
        .eq("category", "relationship")
        .eq("key", "agent_nickname")
        .eq("scope", "user_agent")
        .eq("target_agent_id", smokeAgent.id)
        .order("created_at", { ascending: false });

    expect(nicknameRowsAfterRestoreError).toBeNull();
    const activeRowsAfterRestore =
      nicknameRowsAfterRestore
        ?.filter((row) => row.status === "active")
        .map((row) => row.content) ?? [];
    const supersededRowsAfterRestore =
      nicknameRowsAfterRestore
        ?.filter((row) => row.status === "superseded")
        .map((row) => row.content) ?? [];

    expect(activeRowsAfterRestore).toEqual(["小芳"]);
    expect(supersededRowsAfterRestore).toEqual(expect.arrayContaining(["阿花"]));

    const restoredThreadResponse = await request.post("/api/test/smoke-create-thread", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        agentName: "Smoke Memory Coach"
      }
    });

    expect(restoredThreadResponse.ok()).toBeTruthy();
    const { threadId: restoredThreadId } = (await restoredThreadResponse.json()) as {
      threadId: string;
    };

    const restoredRecallResponse = await request.post("/api/test/smoke-send-turn", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        threadId: restoredThreadId,
        content: "你叫什么？"
      }
    });

    expect(restoredRecallResponse.ok()).toBeTruthy();
    const restoredAssistantMessage = await getLatestAssistantMessageForThread(
      restoredThreadId
    );
    expect(restoredAssistantMessage.content).toBe("哈哈，我叫小芳！");
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

  test("keeps direct preferred-name follow-ups on relationship recall instead of default grounded fallback", async ({
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
    const { threadId: seedThreadId } = (await createThreadResponse.json()) as {
      threadId: string;
    };

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后我叫你小芳可以吗？"
    ]) {
      const response = await request.post("/api/test/smoke-send-turn", {
        headers: {
          "x-smoke-secret": smokeSecret,
          "Content-Type": "application/json"
        },
        data: {
          threadId: seedThreadId,
          content
        }
      });

      expect(response.ok()).toBeTruthy();
    }

    const sameAgentThreadResponse = await request.post(
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

    expect(sameAgentThreadResponse.ok()).toBeTruthy();
    const { threadId } = (await sameAgentThreadResponse.json()) as {
      threadId: string;
    };

    for (const content of ["请简单介绍一下你自己。", "那接下来呢？"]) {
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

    const preferredNameFollowUpResponse = await request.post(
      "/api/test/smoke-send-turn",
      {
        headers: {
          "x-smoke-secret": smokeSecret,
          "Content-Type": "application/json"
        },
        data: {
          threadId,
          content: "那你接下来会怎么称呼我？"
        }
      }
    );

    expect(preferredNameFollowUpResponse.ok()).toBeTruthy();

    const latestAssistant = await getLatestAssistantMessageForThread(threadId);

    expect(latestAssistant.content).toContain("阿强");
    expect(latestAssistant.metadata.question_type).toBe(
      "direct-relationship-confirmation"
    );
    expect(latestAssistant.metadata.answer_strategy).toBe(
      "relationship-recall-first"
    );
    expect(latestAssistant.metadata.answer_strategy_reason_code).toBe(
      "direct-relationship-question"
    );
    expect(latestAssistant.metadata.continuation_reason_code).toBeNull();
    expect(latestAssistant.metadata.answer_strategy).not.toBe(
      "default-grounded"
    );
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

  test("records long-chain pressure watch signals only in developer diagnostics", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后我叫你小芳可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "请简单介绍一下你自己。",
      "接下来你会怎么帮助我？",
      "如果我今天状态不太好，你会怎么和我说？",
      "最后你会怎么陪我把事情推进下去？",
      "那你再简单鼓励我一句。"
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

    const latestAssistant = await getLatestAssistantMessageForThread(threadId);

    expect(latestAssistant.metadata.answer_strategy).toBe("same-thread-continuation");
    expect(latestAssistant.metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(latestAssistant.metadata.same_thread_continuation_applicable).toBe(true);
    expect(latestAssistant.metadata.recent_raw_turn_count).toBe(15);
    expect(latestAssistant.metadata.approx_context_pressure).toBe("elevated");
    expect(latestAssistant.metadata.long_chain_pressure_candidate).toBe(true);
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

  test("clarifies current-thread versus default-agent edits in the lightweight agent sheet", async ({
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
    await expect(page.getByLabel("Message")).toBeVisible();

    const memoryCoachCard = page
      .locator(".agent-card")
      .filter({ hasText: "Smoke Memory Coach" })
      .first();
    await memoryCoachCard.getByRole("button", { name: "Set as default" }).click();
    await expect(
      memoryCoachCard.getByRole("button", { name: "Workspace default" })
    ).toBeVisible();

    const smokeGuideCard = page
      .locator(".agent-card")
      .filter({ hasText: "Smoke Guide" })
      .first();
    await smokeGuideCard.getByRole("button", { name: "Edit" }).click();

    const currentAgentDialog = page.getByRole("dialog", {
      name: "Lightweight agent details"
    });
    await expect(
      currentAgentDialog.getByText(
        "This agent is replying in the current thread."
      )
    ).toBeVisible();
    await expect(
      currentAgentDialog.getByText(
        "This thread is already bound to this agent"
      )
    ).toBeVisible();
    await currentAgentDialog
      .getByRole("button", { name: "Close" })
      .evaluate((node: HTMLButtonElement) => node.click());

    await memoryCoachCard.getByRole("button", { name: "Edit" }).click();
    const defaultAgentDialog = page.getByRole("dialog", {
      name: "Lightweight agent details"
    });
    await expect(
      defaultAgentDialog.getByText("This agent is the workspace default.")
    ).toBeVisible();
    await expect(
      defaultAgentDialog.getByText(
        "Switching the model profile here only changes how future new threads start with this default agent."
      )
    ).toBeVisible();
  });

  test("keeps chat and memory helper copy lightweight on the current surfaces", async ({
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
    await expect(page.getByLabel("Message")).toBeVisible();

    await expect(
      page.getByText(
        "Open the short note under the reply when you want the main reason for that turn."
      )
    ).toBeVisible();
    await expect(
      page.getByText(
        "See what the system remembers here and whether it is active now."
      )
    ).toBeVisible();
    await expect(
      page.getByText(
        "Hidden or incorrect memory stays out of recall until restored. Lower-confidence memory can still appear, but with lighter emphasis."
      )
    ).toBeVisible();
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

  test("keeps explicit Chinese continuation requests in Chinese after the thread already switched", async ({
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

    for (const content of [
      "I am a product designer and I prefer concise weekly planning.",
      "Please introduce yourself briefly.",
      "你记得我做什么工作吗？",
      "那接下来呢？",
      "再用一句话说一遍。",
      "ok, now continue in Chinese."
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

    expect(metadata.reply_language_source).toBe("latest-user-message");
    expect(metadata.reply_language_detected).toBe("zh-Hans");
    expect(latestAssistantMessage.content).toMatch(/[一-龥]/u);
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

  test("keeps profession recall follow-ups on the direct-recall path", async ({
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
        content: "I am a product designer."
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
    const { threadId } = (await recallThreadResponse.json()) as { threadId: string };

    for (const content of [
      "What profession do you remember that I work in? If you do not know, say you do not know.",
      "So what kind of work do I do?",
      "What do you remember about my work?"
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

    expect(metadata.question_type).toBe("direct-fact");
    expect(metadata.answer_strategy).toBe("structured-recall-first");
    expect(metadata.answer_strategy_reason_code).toBe("direct-memory-question");
    expect(latestAssistantMessage.content).toContain("product designer");
  });

  test("ignores out-of-scope user-agent memories during profession recall", async ({
    request
  }) => {
    const admin = getSmokeAdminClient();
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

    const { data: threadRow, error: threadError } = await admin
      .from("threads")
      .select("workspace_id, owner_user_id, agent_id")
      .eq("id", threadId)
      .maybeSingle();

    expect(threadError).toBeNull();
    expect(threadRow).toBeTruthy();

    const seedTurnResponse = await request.post("/api/test/smoke-send-turn", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        threadId,
        content: "Just noting that we are starting a new thread."
      }
    });

    expect(seedTurnResponse.ok()).toBeTruthy();

    const { data: seedUserMessage, error: seedUserMessageError } = await admin
      .from("messages")
      .select("id")
      .eq("thread_id", threadId)
      .eq("role", "user")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    expect(seedUserMessageError).toBeNull();
    expect(seedUserMessage).toBeTruthy();

    const otherAgent = await getSmokeAgentByName("Smoke Memory Coach");

    const { error: insertError } = await admin.from("memory_items").insert({
      workspace_id: threadRow?.workspace_id,
      user_id: threadRow?.owner_user_id,
      agent_id: otherAgent.id,
      source_message_id: seedUserMessage?.id,
      memory_type: "profile",
      content: "product designer",
      confidence: 0.95,
      category: "profile",
      key: "profession",
      value: "product designer",
      scope: "user_agent",
      subject_user_id: threadRow?.owner_user_id,
      target_agent_id: otherAgent.id,
      target_thread_id: null,
      stability: "high",
      status: "active",
      source_refs: [],
      metadata: {
        smoke_seed: true,
        out_of_scope_seed: true
      }
    });

    expect(insertError).toBeNull();

    const recallResponse = await request.post("/api/test/smoke-send-turn", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        threadId,
        content: "What profession do you remember that I work in? If you do not know, say you do not know."
      }
    });

    expect(recallResponse.ok()).toBeTruthy();

    const latestAssistantMessage = await getLatestAssistantMessageForThread(
      threadId
    );
    const metadata = latestAssistantMessage.metadata;

    expect(metadata.question_type).toBe("direct-fact");
    expect(metadata.answer_strategy).toBe("structured-recall-first");
    expect(metadata.answer_strategy_reason_code).toBe("direct-memory-question");
    expect(latestAssistantMessage.content.toLowerCase()).not.toContain(
      "product designer"
    );
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

  test("keeps seeded relationship style on explanatory follow-ups in the same thread", async ({
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

    for (const content of [
      "以后和我说话轻松一点，可以吗？",
      "请简单介绍一下你自己。",
      "接下来你会怎么帮助我？"
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

    expect(metadata.question_type).toBe("open-ended-summary");
    expect(metadata.answer_strategy).toBe("grounded-open-ended-summary");
    expect(metadata.answer_strategy_reason_code).toBe(
      "relationship-answer-shape-prompt"
    );
    expect(metadata.continuation_reason_code).toBeNull();
    expect(metadata.recent_raw_turn_count).toBe(5);
    expect(metadata.approx_context_pressure).toBe("low");
    expect(latestAssistantMessage.content).toContain("接下来");
    expect(latestAssistantMessage.content).not.toContain("如果你今天状态不太好");
  });

  test("keeps seeded relationship continuity on natural self-intro and help-next phrasing", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "你先介绍下你自己吧。"
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

    const introMessage = await getLatestAssistantMessageForThread(threadId);

    expect(introMessage.metadata.question_type).toBe("open-ended-summary");
    expect(introMessage.metadata.answer_strategy).toBe(
      "grounded-open-ended-summary"
    );
    expect(introMessage.metadata.answer_strategy_reason_code).toBe(
      "relationship-answer-shape-prompt"
    );
    expect(introMessage.content).toContain("阿强");

    const explanatoryResponse = await request.post("/api/test/smoke-send-turn", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        threadId,
        content: "接下来你会怎么帮我继续？"
      }
    });

    expect(explanatoryResponse.ok()).toBeTruthy();

    const latestAssistantMessage = await getLatestAssistantMessageForThread(
      threadId
    );

    expect(latestAssistantMessage.metadata.question_type).toBe(
      "open-ended-summary"
    );
    expect(latestAssistantMessage.metadata.answer_strategy).toBe(
      "grounded-open-ended-summary"
    );
    expect(latestAssistantMessage.metadata.answer_strategy_reason_code).toBe(
      "relationship-answer-shape-prompt"
    );
    expect(latestAssistantMessage.content).toContain("阿强");
    expect(latestAssistantMessage.content).toContain("继续");
    expect(latestAssistantMessage.content).not.toContain("如果你今天状态不太好");
  });

  test("keeps short continuation after direct preferred-name confirmation on the same agent", async ({
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

    for (const content of ["以后我叫你小芳可以吗？", "以后你叫我阿强可以吗？"]) {
      const response = await request.post("/api/test/smoke-send-turn", {
        headers: {
          "x-smoke-secret": smokeSecret,
          "Content-Type": "application/json"
        },
        data: {
          threadId: seedThreadId,
          content
        }
      });

      expect(response.ok()).toBeTruthy();
    }

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
      "请简单介绍一下你自己。",
      "那接下来呢？",
      "那你接下来会怎么称呼我？",
      "好，继续。"
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

    expect(metadata.question_type).toBe("fuzzy-follow-up");
    expect(metadata.answer_strategy).toBe("same-thread-continuation");
    expect(metadata.answer_strategy_reason_code).toBe(
      "same-thread-edge-carryover"
    );
    expect(metadata.continuation_reason_code).toBe("short-fuzzy-follow-up");
    expect(latestAssistantMessage.content).toContain("阿强");
  });

  test("keeps natural rephrased continuation prompts on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "请简单介绍一下你自己。",
      "那你继续说说。"
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

    expect(metadata.question_type).toBe("fuzzy-follow-up");
    expect(metadata.answer_strategy).toBe("same-thread-continuation");
    expect(metadata.answer_strategy_reason_code).toBe(
      "same-thread-edge-carryover"
    );
    expect(metadata.continuation_reason_code).toBe("short-fuzzy-follow-up");
    expect(latestAssistantMessage.content).toContain("阿强");
  });

  test("records minimal role core packet contract on assistant replies", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
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

    const latestAssistantMessage = await getLatestAssistantMessageForThread(
      threadId
    );
    const roleCorePacket = latestAssistantMessage.metadata.role_core_packet as
      | {
          packet_version: string;
          identity: {
            agent_id: string;
            agent_name: string;
          };
          persona_summary: string | null;
          style_guidance: string | null;
          relationship_stance: {
            effective: string;
            source: string;
          };
          language_behavior: {
            reply_language_target: string;
            reply_language_source: string;
            same_thread_continuation_preferred: boolean;
          };
        }
      | undefined;

    expect(roleCorePacket).toBeDefined();
    expect(roleCorePacket?.packet_version).toBe("v1");
    expect(roleCorePacket?.identity.agent_name).toBe("Smoke Memory Coach");
    expect(roleCorePacket?.identity.agent_id).toBeTruthy();
    expect(roleCorePacket?.persona_summary).toBeTruthy();
    expect(roleCorePacket?.style_guidance).toBeTruthy();
    expect(roleCorePacket?.relationship_stance.effective).toBe("casual");
    expect(roleCorePacket?.relationship_stance.source).toBe("relationship_memory");
    expect(roleCorePacket?.language_behavior.reply_language_target).toBe("zh-Hans");
    expect(roleCorePacket?.language_behavior.reply_language_source).toBe(
      "latest-user-message"
    );
    expect(roleCorePacket?.language_behavior.same_thread_continuation_preferred).toBe(
      false
    );
  });

  test("keeps natural light supportive variants on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "如果我今天状态不太好，你会怎么和我说？",
      "那你再支持我一下吧。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(latestAssistantMessage.content).toContain("阿强");
  });

  test("keeps brief emotional catch prompts on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "我今天脑子有点乱，也有点累。",
      "你先轻轻接我一下。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(latestAssistantMessage.content).toContain("阿强");
  });

  test("keeps friend-like emotional catch variants on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "我今天有点撑不住了。",
      "你先接住我一下。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(latestAssistantMessage.content).toContain("阿强");
  });

  test("keeps one-line soft catch prompts on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "我今天有点绷不住了。",
      "你就回我一句就好。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(latestAssistantMessage.content).toContain("阿强");
    expect(latestAssistantMessage.content).not.toContain("\n");
    expect(latestAssistantMessage.content).not.toContain("我们继续");
    expect(latestAssistantMessage.content).toBe("阿强，我在，先别一个人扛着。");
  });

  test("keeps brief steadying prompts on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "我现在有点绷不住。",
      "你先帮我缓一下，再说。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(latestAssistantMessage.content).toBe("阿强，先缓一下，我陪着你。");
    expect(latestAssistantMessage.content).not.toContain("建议");
    expect(latestAssistantMessage.content).not.toContain("分析");
  });

  test("keeps gentle carry-forward prompts on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "我今天脑子有点乱，也有点累。",
      "你先帮我缓一下，再陪我往下走一点。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(latestAssistantMessage.content).toBe("阿强，先缓一下，我陪你往下顺一点。");
    expect(latestAssistantMessage.content).not.toContain("\n");
    expect(latestAssistantMessage.content).not.toContain("建议");
    expect(latestAssistantMessage.content).not.toContain("分析");
    expect(latestAssistantMessage.content).not.toContain("解释");
    expect(latestAssistantMessage.content).not.toContain("第一步");
    expect(latestAssistantMessage.content).not.toContain("先做");
  });

  test("keeps brief catch and carry-forward from collapsing after anti-analysis openings", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "我现在有点乱，你先别急着分析我。",
      "你就回我一句就好。",
      "你先帮我缓一下，再陪我往下走一点。"
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

    const messages = await getAssistantMessagesForThread(threadId);
    const antiAnalysisReply = messages.at(-3);
    const briefCatchReply = messages.at(-2);
    const carryForwardReply = messages.at(-1);

    expect(antiAnalysisReply).toBeDefined();
    expect(briefCatchReply).toBeDefined();
    expect(carryForwardReply).toBeDefined();

    expect(antiAnalysisReply?.metadata.answer_strategy).toBe(
      "same-thread-continuation"
    );
    expect(antiAnalysisReply?.content).toContain("先不急着分析你");
    expect(briefCatchReply?.metadata.answer_strategy).toBe("same-thread-continuation");
    expect(briefCatchReply?.metadata.answer_strategy_reason_code).toBe(
      "same-thread-edge-carryover"
    );
    expect(briefCatchReply?.metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(briefCatchReply?.content).toBe("阿强，我在，先别一个人扛着。");
    expect(briefCatchReply?.content).not.toContain("我们继续");

    expect(carryForwardReply?.metadata.answer_strategy).toBe(
      "same-thread-continuation"
    );
    expect(carryForwardReply?.metadata.answer_strategy_reason_code).toBe(
      "same-thread-edge-carryover"
    );
    expect(carryForwardReply?.metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(carryForwardReply?.content).toBe("阿强，先缓一下，我陪你往下顺一点。");
    expect(carryForwardReply?.content).not.toContain("我们继续");
    expect(carryForwardReply?.content).not.toContain("分析");
    expect(carryForwardReply?.content).not.toContain("建议");
  });

  test("keeps friend-like soft follow-up prompts on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "我现在有点乱，也有点累。",
      "你就继续陪我说一句。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(latestAssistantMessage.content).toBe(
      "阿强，我继续陪着你说，我们慢慢来。"
    );
    expect(latestAssistantMessage.content).not.toContain("\n");
    expect(latestAssistantMessage.content).not.toContain("建议");
    expect(latestAssistantMessage.content).not.toContain("总结");
    expect(latestAssistantMessage.content).not.toContain("解释");
  });

  test("keeps stay-with-me follow-up prompts on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "我现在有点乱，也有点累。",
      "你继续陪着我说就行。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(latestAssistantMessage.content).toBe(
      "阿强，我继续陪着你说，就在这儿。"
    );
    expect(latestAssistantMessage.content).not.toContain("\n");
    expect(latestAssistantMessage.content).not.toContain("建议");
    expect(latestAssistantMessage.content).not.toContain("总结");
    expect(latestAssistantMessage.content).not.toContain("解释");
    expect(latestAssistantMessage.content).not.toContain("我是");
  });

  test("keeps gentle resume-the-rhythm prompts on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "我现在有点乱，也有点累。",
      "好，那你慢慢继续和我说。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(latestAssistantMessage.content).toBe("阿强，好，我们就慢慢接着说。");
    expect(latestAssistantMessage.content).not.toContain("\n");
    expect(latestAssistantMessage.content).not.toContain("总结");
    expect(latestAssistantMessage.content).not.toContain("解释");
    expect(latestAssistantMessage.content).not.toContain("建议");
    expect(latestAssistantMessage.content).not.toContain("重新");
  });

  test("keeps natural resume-the-rhythm variants on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "我现在有点乱，也有点累。",
      "好，你就顺着刚才那样继续说。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(latestAssistantMessage.content).toBe("阿强，好，我就顺着刚才那样接着说。");
    expect(latestAssistantMessage.content).not.toContain("\n");
    expect(latestAssistantMessage.content).not.toContain("重新");
    expect(latestAssistantMessage.content).not.toContain("总结");
    expect(latestAssistantMessage.content).not.toContain("解释");
    expect(latestAssistantMessage.content).not.toContain("建议");
  });

  test("keeps presence-confirming follow-up prompts on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "我现在有点乱，也有点累。",
      "你还在这儿陪我，对吧。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(latestAssistantMessage.content).toBe("阿强，我还在这儿陪着你。");
    expect(latestAssistantMessage.content).not.toContain("\n");
    expect(latestAssistantMessage.content).not.toContain("我是");
    expect(latestAssistantMessage.content).not.toContain("可以帮你");
    expect(latestAssistantMessage.content).not.toContain("建议");
  });

  test("keeps natural presence-confirmation variants on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "我现在有点乱，也有点累。",
      "你先别走开。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(latestAssistantMessage.content).toBe("阿强，好，我先不走开，就在这儿陪着你。");
    expect(latestAssistantMessage.content).not.toContain("\n");
    expect(latestAssistantMessage.content).not.toContain("登录");
    expect(latestAssistantMessage.content).not.toContain("页面");
    expect(latestAssistantMessage.content).not.toContain("解释");
    expect(latestAssistantMessage.content).not.toContain("建议");
  });

  test("keeps non-judging follow-up prompts on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "我现在有点乱，也有点累。",
      "你先别评判我。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(latestAssistantMessage.content).toBe("阿强，好，我先不评判你，就在这儿陪着你。");
    expect(latestAssistantMessage.content).not.toContain("\n");
    expect(latestAssistantMessage.content).not.toContain("建议");
    expect(latestAssistantMessage.content).not.toContain("解释");
    expect(latestAssistantMessage.content).not.toContain("应该");
    expect(latestAssistantMessage.content).not.toContain("道理");
  });

  test("keeps natural non-judging variants on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "我现在有点乱，也有点累。",
      "你先别数落我。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(latestAssistantMessage.content).toBe("阿强，好，我先不数落你，就在这儿陪着你。");
    expect(latestAssistantMessage.content).not.toContain("\n");
    expect(latestAssistantMessage.content).not.toContain("建议");
    expect(latestAssistantMessage.content).not.toContain("解释");
    expect(latestAssistantMessage.content).not.toContain("应该");
    expect(latestAssistantMessage.content).not.toContain("道理");
  });

  test("keeps anti-lecturing follow-up prompts on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "我现在有点乱，也有点累。",
      "你先别教育我。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(latestAssistantMessage.content).toBe("阿强，好，我先不教育你，就在这儿陪着你。");
    expect(latestAssistantMessage.content).not.toContain("\n");
    expect(latestAssistantMessage.content).not.toContain("建议");
    expect(latestAssistantMessage.content).not.toContain("解释");
    expect(latestAssistantMessage.content).not.toContain("应该");
    expect(latestAssistantMessage.content).not.toContain("道理");
  });

  test("keeps natural anti-lecturing variants on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "我现在有点乱，也有点累。",
      "你先别给我上课。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(latestAssistantMessage.content).toBe(
      "阿强，好，我先不给你上课，就在这儿陪着你。"
    );
    expect(latestAssistantMessage.content).not.toContain("\n");
    expect(latestAssistantMessage.content).not.toContain("建议");
    expect(latestAssistantMessage.content).not.toContain("解释");
    expect(latestAssistantMessage.content).not.toContain("应该");
    expect(latestAssistantMessage.content).not.toContain("道理");
  });

  test("keeps stronger anti-lecturing variants on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "我现在有点乱，也有点累。",
      "你先别跟我说教。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(latestAssistantMessage.content).toBe(
      "阿强，好，我先不跟你说教，就在这儿陪着你。"
    );
    expect(latestAssistantMessage.content).not.toContain("\n");
    expect(latestAssistantMessage.content).not.toContain("建议");
    expect(latestAssistantMessage.content).not.toContain("解释");
    expect(latestAssistantMessage.content).not.toContain("应该");
    expect(latestAssistantMessage.content).not.toContain("道理");
  });

  test("keeps anti-correction follow-up prompts on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "我现在有点乱，也有点累。",
      "你先别急着纠正我。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(latestAssistantMessage.content).toBe(
      "阿强，好，我先不急着纠正你，就在这儿陪着你。"
    );
    expect(latestAssistantMessage.content).not.toContain("\n");
    expect(latestAssistantMessage.content).not.toContain("建议");
    expect(latestAssistantMessage.content).not.toContain("解释");
    expect(latestAssistantMessage.content).not.toContain("应该");
    expect(latestAssistantMessage.content).not.toContain("道理");
  });

  test("keeps natural anti-correction variants on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "我现在有点乱，也有点累。",
      "你先别老纠正我。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(latestAssistantMessage.content).toBe(
      "阿强，好，我先不老纠正你，就在这儿陪着你。"
    );
    expect(latestAssistantMessage.content).not.toContain("\n");
    expect(latestAssistantMessage.content).not.toContain("建议");
    expect(latestAssistantMessage.content).not.toContain("解释");
    expect(latestAssistantMessage.content).not.toContain("应该");
    expect(latestAssistantMessage.content).not.toContain("道理");
  });

  test("keeps anti-conclusion follow-up prompts on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "我现在有点乱，也有点累。",
      "你先别给我下结论。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(latestAssistantMessage.content).toBe(
      "阿强，好，我先不急着给你下结论，就在这儿陪着你。"
    );
    expect(latestAssistantMessage.content).not.toContain("\n");
    expect(latestAssistantMessage.content).not.toContain("建议");
    expect(latestAssistantMessage.content).not.toContain("解释");
    expect(latestAssistantMessage.content).not.toContain("应该");
    expect(latestAssistantMessage.content).not.toContain("道理");
  });

  test("keeps natural anti-conclusion variants on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "我现在有点乱，也有点累。",
      "你先别这么快下结论。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(latestAssistantMessage.content).toBe(
      "阿强，好，我先不这么快给你下结论，就在这儿陪着你。"
    );
    expect(latestAssistantMessage.content).not.toContain("\n");
    expect(latestAssistantMessage.content).not.toContain("建议");
    expect(latestAssistantMessage.content).not.toContain("解释");
    expect(latestAssistantMessage.content).not.toContain("应该");
    expect(latestAssistantMessage.content).not.toContain("道理");
  });

  test("keeps anti-labeling follow-up prompts on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "我现在有点乱，也有点累。",
      "你先别给我定性。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(latestAssistantMessage.content).toBe(
      "阿强，好，我先不急着给你定性，就在这儿陪着你。"
    );
    expect(latestAssistantMessage.content).not.toContain("\n");
    expect(latestAssistantMessage.content).not.toContain("建议");
    expect(latestAssistantMessage.content).not.toContain("解释");
    expect(latestAssistantMessage.content).not.toContain("应该");
    expect(latestAssistantMessage.content).not.toContain("道理");
  });

  test("keeps natural anti-labeling variants on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "我现在有点乱，也有点累。",
      "你先别急着给我定性。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(latestAssistantMessage.content).toBe(
      "阿强，好，我先不急着给你定性，就在这儿陪着你。"
    );
    expect(latestAssistantMessage.content).not.toContain("\n");
    expect(latestAssistantMessage.content).not.toContain("建议");
    expect(latestAssistantMessage.content).not.toContain("解释");
    expect(latestAssistantMessage.content).not.toContain("应该");
    expect(latestAssistantMessage.content).not.toContain("道理");
  });

  test("keeps anti-tagging follow-up prompts on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "我现在有点乱，也有点累。",
      "你先别给我贴标签。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(latestAssistantMessage.content).toBe(
      "阿强，好，我先不急着给你贴标签，就在这儿陪着你。"
    );
    expect(latestAssistantMessage.content).not.toContain("\n");
    expect(latestAssistantMessage.content).not.toContain("建议");
    expect(latestAssistantMessage.content).not.toContain("解释");
    expect(latestAssistantMessage.content).not.toContain("应该");
    expect(latestAssistantMessage.content).not.toContain("道理");
  });

  test("keeps natural anti-tagging variants on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "我现在有点乱，也有点累。",
      "你先别急着给我贴标签。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(latestAssistantMessage.content).toBe(
      "阿强，好，我先不急着给你贴标签，就在这儿陪着你。"
    );
    expect(latestAssistantMessage.content).not.toContain("\n");
    expect(latestAssistantMessage.content).not.toContain("建议");
    expect(latestAssistantMessage.content).not.toContain("解释");
    expect(latestAssistantMessage.content).not.toContain("应该");
    expect(latestAssistantMessage.content).not.toContain("道理");
  });

  test("keeps anti-mischaracterization follow-up prompts on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "我现在有点乱，也有点累。",
      "你先别把我说成那样。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(latestAssistantMessage.content).toBe(
      "阿强，好，我先不急着把你说成那样，就在这儿陪着你。"
    );
    expect(latestAssistantMessage.content).not.toContain("\n");
    expect(latestAssistantMessage.content).not.toContain("建议");
    expect(latestAssistantMessage.content).not.toContain("解释");
    expect(latestAssistantMessage.content).not.toContain("应该");
    expect(latestAssistantMessage.content).not.toContain("道理");
  });

  test("keeps natural anti-mischaracterization variants on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "我现在有点乱，也有点累。",
      "你先别把我想成那样。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(latestAssistantMessage.content).toBe(
      "阿强，好，我先不急着把你想成那样，就在这儿陪着你。"
    );
    expect(latestAssistantMessage.content).not.toContain("\n");
    expect(latestAssistantMessage.content).not.toContain("建议");
    expect(latestAssistantMessage.content).not.toContain("解释");
    expect(latestAssistantMessage.content).not.toContain("应该");
    expect(latestAssistantMessage.content).not.toContain("道理");
  });

  test("keeps anti-overreading follow-up prompts on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "我现在有点乱，也有点累。",
      "你先别替我解读。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(latestAssistantMessage.content).toBe(
      "阿强，好，我先不急着替你解读，就在这儿陪着你。"
    );
    expect(latestAssistantMessage.content).not.toContain("\n");
    expect(latestAssistantMessage.content).not.toContain("建议");
    expect(latestAssistantMessage.content).not.toContain("解释");
    expect(latestAssistantMessage.content).not.toContain("应该");
    expect(latestAssistantMessage.content).not.toContain("道理");
  });

  test("keeps natural anti-overreading variants on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "我现在有点乱，也有点累。",
      "你先别脑补我。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(latestAssistantMessage.content).toBe(
      "阿强，好，我先不急着脑补你，就在这儿陪着你。"
    );
    expect(latestAssistantMessage.content).not.toContain("\n");
    expect(latestAssistantMessage.content).not.toContain("建议");
    expect(latestAssistantMessage.content).not.toContain("解释");
    expect(latestAssistantMessage.content).not.toContain("应该");
    expect(latestAssistantMessage.content).not.toContain("道理");
  });

  test("keeps anti-analysis follow-up prompts on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "我现在有点乱，也有点累。",
      "你先别急着分析我。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(latestAssistantMessage.content).toBe(
      "阿强，好，我先不急着分析你，就在这儿陪着你。"
    );
    expect(latestAssistantMessage.content).not.toContain("\n");
    expect(latestAssistantMessage.content).not.toContain("建议");
    expect(latestAssistantMessage.content).not.toContain("解释");
    expect(latestAssistantMessage.content).not.toContain("应该");
    expect(latestAssistantMessage.content).not.toContain("道理");
  });

  test("keeps natural anti-analysis variants on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "我现在有点乱，也有点累。",
      "你先别上来就分析我。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(latestAssistantMessage.content).toBe(
      "阿强，好，我先不急着分析你，就在这儿陪着你。"
    );
    expect(latestAssistantMessage.content).not.toContain("\n");
    expect(latestAssistantMessage.content).not.toContain("建议");
    expect(latestAssistantMessage.content).not.toContain("解释");
    expect(latestAssistantMessage.content).not.toContain("应该");
    expect(latestAssistantMessage.content).not.toContain("道理");
  });

  test("keeps anti-probing follow-up prompts on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "我现在有点乱，也有点累。",
      "你先别问我为什么。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(latestAssistantMessage.content).toBe(
      "阿强，好，我先不问你为什么，就在这儿陪着你。"
    );
    expect(latestAssistantMessage.content).not.toContain("\n");
    expect(latestAssistantMessage.content).not.toContain("建议");
    expect(latestAssistantMessage.content).not.toContain("解释");
    expect(latestAssistantMessage.content).not.toContain("应该");
    expect(latestAssistantMessage.content).not.toContain("道理");
  });

  test("keeps natural anti-probing variants on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "我现在有点乱，也有点累。",
      "你先别追着问我。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(latestAssistantMessage.content).toBe(
      "阿强，好，我先不问你为什么，就在这儿陪着你。"
    );
    expect(latestAssistantMessage.content).not.toContain("\n");
    expect(latestAssistantMessage.content).not.toContain("建议");
    expect(latestAssistantMessage.content).not.toContain("解释");
    expect(latestAssistantMessage.content).not.toContain("应该");
    expect(latestAssistantMessage.content).not.toContain("道理");
  });

  test("keeps stronger anti-probing variants on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "我现在有点乱，也有点累。",
      "你先别盘问我。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(latestAssistantMessage.content).toBe(
      "阿强，好，我先不盘问你，就在这儿陪着你。"
    );
    expect(latestAssistantMessage.content).not.toContain("\n");
    expect(latestAssistantMessage.content).not.toContain("建议");
    expect(latestAssistantMessage.content).not.toContain("解释");
    expect(latestAssistantMessage.content).not.toContain("应该");
    expect(latestAssistantMessage.content).not.toContain("道理");
  });

  test("keeps anti-rushing follow-up prompts on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "我现在有点乱，也有点累。",
      "你先别催我。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(latestAssistantMessage.content).toBe(
      "阿强，好，我先不催你，就在这儿陪着你。"
    );
    expect(latestAssistantMessage.content).not.toContain("\n");
    expect(latestAssistantMessage.content).not.toContain("建议");
    expect(latestAssistantMessage.content).not.toContain("解释");
    expect(latestAssistantMessage.content).not.toContain("应该");
    expect(latestAssistantMessage.content).not.toContain("道理");
  });

  test("keeps stronger anti-rushing variants on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "我现在有点乱，也有点累。",
      "你先别逼我。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(latestAssistantMessage.content).toBe(
      "阿强，好，我先不逼你，就在这儿陪着你。"
    );
    expect(latestAssistantMessage.content).not.toContain("\n");
    expect(latestAssistantMessage.content).not.toContain("建议");
    expect(latestAssistantMessage.content).not.toContain("解释");
    expect(latestAssistantMessage.content).not.toContain("应该");
    expect(latestAssistantMessage.content).not.toContain("道理");
  });

  test("keeps anti-solutioning follow-up prompts on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "我现在有点乱，也有点累。",
      "你先别急着帮我解决。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(latestAssistantMessage.content).toBe(
      "阿强，好，我先不急着帮你解决，就在这儿陪着你。"
    );
    expect(latestAssistantMessage.content).not.toContain("\n");
    expect(latestAssistantMessage.content).not.toContain("建议");
    expect(latestAssistantMessage.content).not.toContain("解释");
    expect(latestAssistantMessage.content).not.toContain("应该");
    expect(latestAssistantMessage.content).not.toContain("道理");
  });

  test("keeps natural anti-solutioning variants on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "我现在有点乱，也有点累。",
      "你先别上来就帮我解决。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(latestAssistantMessage.content).toBe(
      "阿强，好，我先不上来就帮你解决，就在这儿陪着你。"
    );
    expect(latestAssistantMessage.content).not.toContain("\n");
    expect(latestAssistantMessage.content).not.toContain("建议");
    expect(latestAssistantMessage.content).not.toContain("解释");
    expect(latestAssistantMessage.content).not.toContain("应该");
    expect(latestAssistantMessage.content).not.toContain("道理");
  });

  test("keeps anti-comforting follow-up prompts on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "我现在有点乱，也有点累。",
      "你先别急着安慰我。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(latestAssistantMessage.content).toBe(
      "阿强，好，我先不急着安慰你，就在这儿陪着你。"
    );
    expect(latestAssistantMessage.content).not.toContain("\n");
    expect(latestAssistantMessage.content).not.toContain("建议");
    expect(latestAssistantMessage.content).not.toContain("解释");
    expect(latestAssistantMessage.content).not.toContain("应该");
    expect(latestAssistantMessage.content).not.toContain("道理");
  });

  test("keeps natural anti-comforting variants on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "我现在有点乱，也有点累。",
      "你先别给我打气。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(latestAssistantMessage.content).toBe(
      "阿强，好，我先不给你打气，就在这儿陪着你。"
    );
    expect(latestAssistantMessage.content).not.toContain("\n");
    expect(latestAssistantMessage.content).not.toContain("建议");
    expect(latestAssistantMessage.content).not.toContain("解释");
    expect(latestAssistantMessage.content).not.toContain("应该");
    expect(latestAssistantMessage.content).not.toContain("道理");
  });

  test("keeps anti-advice follow-up prompts on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "我现在有点乱，也有点累。",
      "你先别急着给我建议。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(latestAssistantMessage.content).toBe(
      "阿强，好，我先不急着给你建议，就在这儿陪着你。"
    );
    expect(latestAssistantMessage.content).not.toContain("\n");
    expect(latestAssistantMessage.content).not.toContain("建议你");
    expect(latestAssistantMessage.content).not.toContain("解释");
    expect(latestAssistantMessage.content).not.toContain("应该");
    expect(latestAssistantMessage.content).not.toContain("道理");
  });

  test("keeps natural anti-advice variants on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "我现在有点乱，也有点累。",
      "你先别上来就给我建议。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(latestAssistantMessage.content).toBe(
      "阿强，好，我先不上来就给你建议，就在这儿陪着你。"
    );
    expect(latestAssistantMessage.content).not.toContain("\n");
    expect(latestAssistantMessage.content).not.toContain("建议你");
    expect(latestAssistantMessage.content).not.toContain("解释");
    expect(latestAssistantMessage.content).not.toContain("应该");
    expect(latestAssistantMessage.content).not.toContain("道理");
  });

  test("keeps anti-minimizing follow-up prompts on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "我现在有点乱，也有点累。",
      "你先别跟我说这没什么。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(latestAssistantMessage.content).toBe(
      "阿强，好，我先不跟你说这没什么，就在这儿陪着你。"
    );
    expect(latestAssistantMessage.content).not.toContain("\n");
    expect(latestAssistantMessage.content).not.toContain("没事");
    expect(latestAssistantMessage.content).not.toContain("想太多");
    expect(latestAssistantMessage.content).not.toContain("建议");
    expect(latestAssistantMessage.content).not.toContain("解释");
  });

  test("keeps natural anti-minimizing variants on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "我现在有点乱，也有点累。",
      "你先别跟我说没什么大不了。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(latestAssistantMessage.content).toBe(
      "阿强，好，我先不跟你说没什么大不了，就在这儿陪着你。"
    );
    expect(latestAssistantMessage.content).not.toContain("\n");
    expect(latestAssistantMessage.content).not.toContain("没事");
    expect(latestAssistantMessage.content).not.toContain("想太多");
    expect(latestAssistantMessage.content).not.toContain("建议");
    expect(latestAssistantMessage.content).not.toContain("解释");
  });

  test("keeps anti-normalizing follow-up prompts on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "我现在有点乱，也有点累。",
      "你先别跟我说大家都这样。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(latestAssistantMessage.content).toBe(
      "阿强，好，我先不跟你说大家都这样，就在这儿陪着你。"
    );
    expect(latestAssistantMessage.content).not.toContain("\n");
    expect(latestAssistantMessage.content).not.toContain("很多人");
    expect(latestAssistantMessage.content).not.toContain("很常见");
    expect(latestAssistantMessage.content).not.toContain("建议");
    expect(latestAssistantMessage.content).not.toContain("解释");
  });

  test("keeps natural anti-normalizing variants on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "我现在有点乱，也有点累。",
      "你先别跟我说谁都会这样。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(latestAssistantMessage.content).toBe(
      "阿强，好，我先不跟你说谁都会这样，就在这儿陪着你。"
    );
    expect(latestAssistantMessage.content).not.toContain("\n");
    expect(latestAssistantMessage.content).not.toContain("很多人");
    expect(latestAssistantMessage.content).not.toContain("很常见");
    expect(latestAssistantMessage.content).not.toContain("建议");
    expect(latestAssistantMessage.content).not.toContain("解释");
  });

  test("keeps anti-comparing follow-up prompts on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "我现在有点乱，也有点累。",
      "你先别拿别人跟我比。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(latestAssistantMessage.content).toBe(
      "阿强，好，我先不拿别人跟你比，就在这儿陪着你。"
    );
    expect(latestAssistantMessage.content).not.toContain("\n");
    expect(latestAssistantMessage.content).not.toContain("别人也");
    expect(latestAssistantMessage.content).not.toContain("谁谁谁");
    expect(latestAssistantMessage.content).not.toContain("建议");
    expect(latestAssistantMessage.content).not.toContain("解释");
  });

  test("keeps natural anti-comparing variants on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "我现在有点乱，也有点累。",
      "你先别老拿别人跟我比。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(latestAssistantMessage.content).toBe(
      "阿强，好，我先不老拿别人跟你比，就在这儿陪着你。"
    );
    expect(latestAssistantMessage.content).not.toContain("\n");
    expect(latestAssistantMessage.content).not.toContain("别人也");
    expect(latestAssistantMessage.content).not.toContain("谁谁谁");
    expect(latestAssistantMessage.content).not.toContain("建议");
    expect(latestAssistantMessage.content).not.toContain("解释");
  });

  test("keeps anti-redirection follow-up prompts on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "我现在有点乱，也有点累。",
      "你先别转移话题。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(latestAssistantMessage.content).toBe(
      "阿强，好，我先不转移话题，就在这儿陪着你。"
    );
    expect(latestAssistantMessage.content).not.toContain("\n");
    expect(latestAssistantMessage.content).not.toContain("换个话题");
    expect(latestAssistantMessage.content).not.toContain("聊点别的");
    expect(latestAssistantMessage.content).not.toContain("建议");
    expect(latestAssistantMessage.content).not.toContain("解释");
  });

  test("keeps natural anti-redirection variants on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "我现在有点乱，也有点累。",
      "你先别岔开话题。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(latestAssistantMessage.content).toBe(
      "阿强，好，我先不岔开话题，就在这儿陪着你。"
    );
    expect(latestAssistantMessage.content).not.toContain("\n");
    expect(latestAssistantMessage.content).not.toContain("换个话题");
    expect(latestAssistantMessage.content).not.toContain("聊点别的");
    expect(latestAssistantMessage.content).not.toContain("建议");
    expect(latestAssistantMessage.content).not.toContain("解释");
  });

  test("keeps anti-definition follow-up prompts on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "我现在有点乱，也有点累。",
      "你先别替我定义。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(latestAssistantMessage.content).toBe(
      "阿强，好，我先不替你定义，就在这儿陪着你。"
    );
    expect(latestAssistantMessage.content).not.toContain("\n");
    expect(latestAssistantMessage.content).not.toContain("建议");
    expect(latestAssistantMessage.content).not.toContain("解释");
    expect(latestAssistantMessage.content).not.toContain("应该");
    expect(latestAssistantMessage.content).not.toContain("道理");
  });

  test("keeps natural anti-definition variants on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "我现在有点乱，也有点累。",
      "你先别替我下定义。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(latestAssistantMessage.content).toBe(
      "阿强，好，我先不替你定义，就在这儿陪着你。"
    );
    expect(latestAssistantMessage.content).not.toContain("\n");
    expect(latestAssistantMessage.content).not.toContain("建议");
    expect(latestAssistantMessage.content).not.toContain("解释");
    expect(latestAssistantMessage.content).not.toContain("应该");
    expect(latestAssistantMessage.content).not.toContain("道理");
  });

  test("keeps anti-categorizing follow-up prompts on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "我现在有点乱，也有点累。",
      "你先别替我归类。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(latestAssistantMessage.content).toBe(
      "阿强，好，我先不替你归类，就在这儿陪着你。"
    );
    expect(latestAssistantMessage.content).not.toContain("\n");
    expect(latestAssistantMessage.content).not.toContain("建议");
    expect(latestAssistantMessage.content).not.toContain("解释");
    expect(latestAssistantMessage.content).not.toContain("应该");
    expect(latestAssistantMessage.content).not.toContain("道理");
  });

  test("keeps same-side follow-up prompts on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "我现在有点乱，也有点累。",
      "你先站我这边。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(latestAssistantMessage.content).toBe("阿强，好，我先站你这边陪着你。");
    expect(latestAssistantMessage.content).not.toContain("\n");
    expect(latestAssistantMessage.content).not.toContain("建议");
    expect(latestAssistantMessage.content).not.toContain("解释");
    expect(latestAssistantMessage.content).not.toContain("道理");
    expect(latestAssistantMessage.content).not.toContain("应该");
  });

  test("keeps natural same-side variants on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "我现在有点乱，也有点累。",
      "你先别跟我讲道理，就站我这边。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(latestAssistantMessage.content).toBe(
      "阿强，好，我先站你这边陪着你，不跟你讲道理。"
    );
    expect(latestAssistantMessage.content).not.toContain("\n");
    expect(latestAssistantMessage.content).not.toContain("建议");
    expect(latestAssistantMessage.content).not.toContain("解释");
    expect(latestAssistantMessage.content).not.toContain("应该");
    expect(latestAssistantMessage.content).not.toContain("分析");
  });

  test("keeps light shared-push prompts on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "我现在有点乱，也有点累。",
      "那我们先一起把这一点弄过去。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(latestAssistantMessage.content).toBe("阿强，好，我们先一起把这一点弄过去。");
    expect(latestAssistantMessage.content).not.toContain("\n");
    expect(latestAssistantMessage.content).not.toContain("建议");
    expect(latestAssistantMessage.content).not.toContain("第一步");
    expect(latestAssistantMessage.content).not.toContain("应该");
    expect(latestAssistantMessage.content).not.toContain("解释");
    expect(latestAssistantMessage.content).not.toContain("总结");
  });

  test("keeps natural shared-push variants on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "我现在有点乱，也有点累。",
      "你先陪我把眼前这一下弄过去。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(latestAssistantMessage.content).toBe("阿强，好，我先陪你把眼前这一下弄过去。");
    expect(latestAssistantMessage.content).not.toContain("\n");
    expect(latestAssistantMessage.content).not.toContain("建议");
    expect(latestAssistantMessage.content).not.toContain("第一步");
    expect(latestAssistantMessage.content).not.toContain("应该");
    expect(latestAssistantMessage.content).not.toContain("解释");
    expect(latestAssistantMessage.content).not.toContain("总结");
  });

  test("keeps natural light advice phrasing on the grounded advice path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "那你先给我一个小建议吧。"
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

    expect(metadata.question_type).toBe("open-ended-advice");
    expect(metadata.answer_strategy).toBe("grounded-open-ended-advice");
    expect(metadata.answer_strategy_reason_code).toBe("open-ended-advice-prompt");
    expect(latestAssistantMessage.content).toContain("好呀");
  });

  test("keeps natural short summary phrasing on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "请简单介绍一下你自己。",
      "那你最后简单收一下吧。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-summary-carryover"
    );
    expect(latestAssistantMessage.content).toContain("阿强");
  });

  test("keeps light closing prompts on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "请简单介绍一下你自己。",
      "那你最后陪我收个尾吧。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-summary-carryover"
    );
    expect(latestAssistantMessage.content).toContain("阿强");
  });

  test("keeps companion-style closing prompts on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "请简单介绍一下你自己。",
      "你帮我把这段收住就行。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-summary-carryover"
    );
    expect(latestAssistantMessage.content).toContain("阿强");
  });

  test("keeps an additional light closing variant on the same-thread carryover path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "请简单介绍一下你自己。",
      "你帮我把这段先收一下吧。"
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
    expect(metadata.continuation_reason_code).toBe(
      "brief-summary-carryover"
    );
    expect(latestAssistantMessage.content).toContain("阿强");
  });

  test("keeps light closing from collapsing after same-side and shared-push chains", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "你先站我这边。",
      "那我们先一起把这一点弄过去。",
      "你最后帮我把这段收一下。"
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

    const messages = await getAssistantMessagesForThread(threadId);
    const sameSideReply = messages.at(-3);
    const sharedPushReply = messages.at(-2);
    const closingReply = messages.at(-1);

    expect(sameSideReply).toBeDefined();
    expect(sharedPushReply).toBeDefined();
    expect(closingReply).toBeDefined();

    expect(sameSideReply?.metadata.answer_strategy).toBe(
      "same-thread-continuation"
    );
    expect(sharedPushReply?.metadata.answer_strategy).toBe(
      "same-thread-continuation"
    );
    expect(closingReply?.metadata.answer_strategy).toBe(
      "same-thread-continuation"
    );
    expect(closingReply?.metadata.answer_strategy_reason_code).toBe(
      "same-thread-edge-carryover"
    );
    expect(closingReply?.metadata.continuation_reason_code).toBe(
      "brief-summary-carryover"
    );
    expect(closingReply?.content).toContain("阿强");
    expect(closingReply?.content).not.toContain("先回到你刚刚的问题");
    expect(closingReply?.content).not.toContain("周计划");
  });

  test("keeps natural carry-forward planning phrasing on the grounded advice path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "那你带我往下走吧。"
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

    expect(metadata.question_type).toBe("open-ended-advice");
    expect(metadata.answer_strategy).toBe("grounded-open-ended-advice");
    expect(metadata.answer_strategy_reason_code).toBe("open-ended-advice-prompt");
    expect(latestAssistantMessage.content).toContain("好呀");
  });

  test("keeps natural step-by-step guidance phrasing on the grounded advice path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "你先陪我理一步。"
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

    expect(metadata.question_type).toBe("open-ended-advice");
    expect(metadata.answer_strategy).toBe("grounded-open-ended-advice");
    expect(metadata.answer_strategy_reason_code).toBe("open-ended-advice-prompt");
    expect(latestAssistantMessage.content).toContain("好呀");
  });

  test("keeps brief steadying and guided next-step from collapsing after anti-advice openings", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "你先别急着给我建议。",
      "你先帮我缓一下，再说。",
      "好，你再陪我理一步。"
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

    const messages = await getAssistantMessagesForThread(threadId);
    const antiAdviceReply = messages.at(-3);
    const steadyingReply = messages.at(-2);
    const guidedReply = messages.at(-1);

    expect(antiAdviceReply).toBeDefined();
    expect(steadyingReply).toBeDefined();
    expect(guidedReply).toBeDefined();

    expect(antiAdviceReply?.metadata.answer_strategy).toBe(
      "same-thread-continuation"
    );
    expect(antiAdviceReply?.content).toContain("先不急着给你建议");

    expect(steadyingReply?.metadata.answer_strategy).toBe(
      "same-thread-continuation"
    );
    expect(steadyingReply?.metadata.answer_strategy_reason_code).toBe(
      "same-thread-edge-carryover"
    );
    expect(steadyingReply?.metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(steadyingReply?.content).toBe("阿强，先缓一下，我陪着你。");
    expect(steadyingReply?.content).not.toContain("我们继续");

    expect(guidedReply?.metadata.answer_strategy).toBe(
      "same-thread-continuation"
    );
    expect(guidedReply?.metadata.answer_strategy_reason_code).toBe(
      "same-thread-edge-carryover"
    );
    expect(guidedReply?.metadata.continuation_reason_code).toBe(
      "brief-supportive-carryover"
    );
    expect(guidedReply?.content).toBe("阿强，我们先只理眼前这一小步，我陪你慢慢顺。");
    expect(guidedReply?.content).not.toContain("我们继续");
    expect(guidedReply?.content).not.toContain("周计划");
    expect(guidedReply?.content).not.toContain("第一步");
  });

  test("keeps natural light reassurance variants on the same relationship line", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "你就轻松点和我说就好。"
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

    expect(latestAssistantMessage.content).toContain("阿强");
    expect(latestAssistantMessage.content).toContain("轻一点和你说");
    expect(latestAssistantMessage.content).not.toContain("偏好");
  });

  test("keeps natural companion-style explanation variants on the grounded advice path", async ({
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

    for (const content of [
      "以后你叫我阿强可以吗？",
      "以后和我说话轻松一点，可以吗？",
      "你就陪我顺一下就行。"
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

    expect(metadata.question_type).toBe("open-ended-advice");
    expect(metadata.answer_strategy).toBe("grounded-open-ended-advice");
    expect(metadata.answer_strategy_reason_code).toBe("open-ended-advice-prompt");
    expect(latestAssistantMessage.content).toContain("好呀");
  });

  test("uses the default-grounded fallback branch for uncategorized grounded prompts", async ({
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

    const seedTurn = await request.post("/api/test/smoke-send-turn", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        threadId,
        content: "I am a product designer and I prefer concise weekly planning."
      }
    });
    expect(seedTurn.ok()).toBeTruthy();

    const fallbackTurn = await request.post("/api/test/smoke-send-turn", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        threadId,
        content: "What should you keep in mind when replying to me later?"
      }
    });
    expect(fallbackTurn.ok()).toBeTruthy();

    const latestAssistantMessage = await getLatestAssistantMessageForThread(
      threadId
    );
    const metadata = latestAssistantMessage.metadata;

    expect(metadata.question_type).toBe("other");
    expect(metadata.answer_strategy).toBe("default-grounded");
    expect(metadata.answer_strategy_reason_code).toBe(
      "default-grounded-fallback"
    );
    expect(metadata.same_thread_continuation_preferred).toBe(false);
    expect(metadata.continuation_reason_code).toBeNull();
    expect(metadata.reply_language_source).toBe("latest-user-message");
    expect(latestAssistantMessage.content).toBe("Sure, we can keep going.");
  });

  test("compares model-profile metadata on the same stable prompt pair", async ({
    request
  }) => {
    const admin = getSmokeAdminClient();
    const smokeGuideAgent = await getSmokeAgentByName("Smoke Guide");
    const defaultProfile = await getSmokeModelProfileBySlug("spark-default");
    const altProfile = await getSmokeModelProfileBySlug("smoke-alt");
    const prompt = "Reply in one sentence with a quick hello.";

    const runTurnWithCurrentProfile = async () => {
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
      const { threadId } = (await createThreadResponse.json()) as {
        threadId: string;
      };

      const turnResponse = await request.post("/api/test/smoke-send-turn", {
        headers: {
          "x-smoke-secret": smokeSecret,
          "Content-Type": "application/json"
        },
        data: {
          threadId,
          content: prompt
        }
      });

      expect(turnResponse.ok()).toBeTruthy();
      return getLatestAssistantMessageForThread(threadId);
    };

    const defaultRun = await runTurnWithCurrentProfile();
    const defaultMetadata = defaultRun.metadata;

    expect(defaultMetadata.question_type).toBe("other");
    expect(defaultMetadata.answer_strategy).toBe("default-grounded");
    expect(defaultMetadata.answer_strategy_reason_code).toBe(
      "default-grounded-fallback"
    );
    expect(defaultMetadata.model_profile_name).toBe("Spark Default");
    expect(defaultMetadata.model_profile_id).toBe(defaultProfile.id);

    const { error: updateError } = await admin
      .from("agents")
      .update({
        default_model_profile_id: altProfile.id,
        updated_at: new Date().toISOString()
      })
      .eq("id", smokeGuideAgent.id);

    expect(updateError).toBeNull();

    const altRun = await runTurnWithCurrentProfile();
    const altMetadata = altRun.metadata;

    expect(altMetadata.question_type).toBe("other");
    expect(altMetadata.answer_strategy).toBe("default-grounded");
    expect(altMetadata.answer_strategy_reason_code).toBe(
      "default-grounded-fallback"
    );
    expect(altMetadata.model_profile_name).toBe("Smoke Alt");
    expect(altMetadata.model_profile_id).toBe(altProfile.id);
    expect(defaultMetadata.model_profile_id).not.toBe(altMetadata.model_profile_id);
    expect(defaultRun.content).toContain("Spark Default");
    expect(altRun.content).toContain("Smoke Alt");
  });
});
