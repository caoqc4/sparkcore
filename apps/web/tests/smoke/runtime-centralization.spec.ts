import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const smokeSecret =
  process.env.PLAYWRIGHT_SMOKE_SECRET ?? "sparkcore-smoke-local";
const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

type AssistantMessageRecord = {
  id: string;
  content: string;
  status: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

function isTransientSupabaseError(error: {
  message?: string | null;
  details?: string | null;
} | null) {
  if (!error) {
    return false;
  }

  const haystack = `${error.message ?? ""} ${error.details ?? ""}`.toLowerCase();
  return (
    haystack.includes("fetch failed") ||
    haystack.includes("econnreset") ||
    haystack.includes("connect timeout") ||
    haystack.includes("tls")
  );
}

async function withSupabaseRetry<T>(fn: () => Promise<T>) {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === 2) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  throw lastError;
}

function getSmokeAdminClient() {
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

function getMetadataObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function getGovernanceMetadata(
  metadata: Record<string, unknown> | null | undefined
) {
  return getMetadataObject(metadata?.governance);
}

function getUserExplanationMetadata(
  metadata: Record<string, unknown> | null | undefined
) {
  return getMetadataObject(metadata?.user_explanation);
}

function getWebDeliveryMetadata(
  metadata: Record<string, unknown> | null | undefined
) {
  return getMetadataObject(metadata?.web_delivery);
}

async function createSmokeThread(request: APIRequestContext, agentName: string) {
  let lastFailure = "Smoke thread creation failed without a response body.";

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await request.post("/api/test/smoke-create-thread", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: { agentName }
    });

    if (response.ok()) {
      const payload = (await response.json()) as { threadId: string };
      expect(payload.threadId).toBeTruthy();
      return payload.threadId;
    }

    lastFailure = await response.text();
    const normalizedFailure = lastFailure.toLowerCase();
    const shouldRetry =
      normalizedFailure.includes("fetch failed") ||
      normalizedFailure.includes("connect timeout") ||
      normalizedFailure.includes("tls");

    if (!shouldRetry || attempt === 2) {
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Smoke thread creation failed: ${lastFailure}`);
}

async function sendSmokeTurn(request: APIRequestContext, threadId: string, content: string) {
  let lastFailure = "Smoke turn creation failed without a response body.";

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await request.post("/api/test/smoke-send-turn", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: { threadId, content }
    });

    if (response.ok()) {
      return;
    }

    lastFailure = await response.text();
    const normalizedFailure = lastFailure.toLowerCase();
    const shouldRetry =
      normalizedFailure.includes("fetch failed") ||
      normalizedFailure.includes("connect timeout") ||
      normalizedFailure.includes("tls");

    if (!shouldRetry || attempt === 2) {
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Smoke turn creation failed: ${lastFailure}`);
}

async function waitForLatestCompletedAssistantMessage(
  threadId: string,
  previousAssistantCount: number
) {
  const admin = getSmokeAdminClient();
  const startedAt = Date.now();

  while (Date.now() - startedAt < 120_000) {
    const { data, error } = await withSupabaseRetry(async () =>
      admin
        .from("messages")
        .select("id, content, status, metadata, created_at")
        .eq("thread_id", threadId)
        .eq("role", "assistant")
        .order("created_at", { ascending: true })
    );

    if (error && !isTransientSupabaseError(error)) {
      expect(error).toBeNull();
    }

    if (error) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      continue;
    }

    const messages = (data ?? []) as AssistantMessageRecord[];
    const completedMessages = messages.filter(
      (message) => message.status === "completed"
    );

    if (completedMessages.length > previousAssistantCount) {
      return completedMessages[completedMessages.length - 1];
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error("Timed out waiting for a completed assistant message.");
}

async function countAssistantMessages(threadId: string) {
  const admin = getSmokeAdminClient();
  const startedAt = Date.now();

  while (Date.now() - startedAt < 30_000) {
    const { count, error } = await withSupabaseRetry(async () =>
      admin
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("thread_id", threadId)
        .eq("role", "assistant")
    );

    if (error && !isTransientSupabaseError(error)) {
      expect(error).toBeNull();
    }

    if (!error) {
      return count ?? 0;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error("Timed out counting assistant messages due to transient Supabase errors.");
}

async function sendChatMessageThroughUi(page: Page, content: string) {
  let textarea = page.locator('textarea[name="content"]');
  let sendButton = page.getByRole("button", { name: /send message/i });

  await expect(textarea).toBeVisible({ timeout: 30_000 });
  await expect(textarea).toBeEditable({ timeout: 30_000 });
  await expect(sendButton).toBeEnabled({ timeout: 30_000 });

  await textarea.fill(content);
  await sendButton.click();

  await Promise.race([
    sendButton.waitFor({ state: "detached", timeout: 10_000 }),
    expect(sendButton).toBeDisabled({ timeout: 10_000 })
  ]).catch(() => null);

  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => null);

  textarea = page.locator('textarea[name="content"]');
  sendButton = page.getByRole("button", { name: /send message/i });

  await expect(textarea).toBeVisible({ timeout: 60_000 });
  await expect(textarea).toBeEditable({ timeout: 60_000 });
  await expect(sendButton).toBeEnabled({ timeout: 60_000 });
}

async function waitForAssistantImageArtifactInUi(
  page: Page,
  threadId: string,
  modelSlug?: string
) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    await reloadThreadAndWait(page, threadId);

    const latestAssistantImage = page.locator(".message-assistant img").last();
    const imageCount = await latestAssistantImage.count();

    if (imageCount > 0) {
      await expect(latestAssistantImage).toBeVisible({ timeout: 10_000 });

      if (modelSlug) {
        await expect(page.locator(".message-assistant figcaption").last()).toContainText(
          modelSlug,
          {
            timeout: 10_000
          }
        );
      }

      return;
    }

    await page.waitForTimeout(2000);
  }

  throw new Error(`Timed out waiting for an assistant image artifact in thread ${threadId}.`);
}

async function assertComposerBoundToThread(page: Page, threadId: string) {
  await expect(page.locator('input[name="thread_id"]')).toHaveValue(threadId, {
    timeout: 30_000
  });
}

async function chatWorkspaceShowsLoadFailure(page: Page) {
  const unavailableHeading = page.getByRole("heading", {
    name: "Chat workspace is unavailable"
  });

  if ((await unavailableHeading.count()) === 0) {
    return false;
  }

  return unavailableHeading.isVisible().catch(() => false);
}

async function reloadThreadAndWait(page: Page, threadId: string) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (attempt === 0) {
      await page.reload();
    } else {
      await page.goto(
        `/api/test/smoke-login?secret=${smokeSecret}&redirect=/chat?thread=${threadId}`
      );
    }

    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => null);
    await expect(page).toHaveURL(new RegExp(`thread=${threadId}`), {
      timeout: 30_000
    });

    if (await chatWorkspaceShowsLoadFailure(page)) {
      continue;
    }

    const threadInput = page.locator('input[name="thread_id"]');
    if ((await threadInput.count()) === 0) {
      await page.waitForTimeout(500);
      continue;
    }

    await assertComposerBoundToThread(page, threadId);
    return;
  }

  throw new Error(`Failed to restore chat thread composer for ${threadId}.`);
}

async function waitForHydratedThreadContext(
  page: Page,
  threadId: string,
  expectedTexts: string[]
) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await reloadThreadAndWait(page, threadId);

    try {
      for (const text of expectedTexts) {
        await expect(page.getByText(text).last()).toBeVisible({
          timeout: 10_000
        });
      }
      return;
    } catch (error) {
      if (attempt === 2) {
        throw error;
      }
    }
  }
}

async function assertNoThreadFeedbackError(page: Page) {
  const errorNotice = page.locator(".notice.notice-error").last();
  const count = await errorNotice.count();

  if (count === 0) {
    return;
  }

  const text = (await errorNotice.textContent())?.trim() ?? "";

  if (text.length === 0) {
    return;
  }

  throw new Error(`Chat UI surfaced an error notice: ${text}`);
}

function getAnswerStrategyMetadata(
  metadata: Record<string, unknown> | null | undefined
) {
  return {
    questionType:
      typeof metadata?.question_type === "string" ? metadata.question_type : null,
    answerStrategy:
      typeof metadata?.answer_strategy === "string"
        ? metadata.answer_strategy
        : null,
    answerStrategyReasonCode:
      typeof metadata?.answer_strategy_reason_code === "string"
        ? metadata.answer_strategy_reason_code
        : null
  };
}

async function prepareRolePresenceThread(
  page: Page,
  request: APIRequestContext
) {
  const threadId = await createSmokeThread(request, "Smoke Memory Coach");
  const initialAssistantCount = await countAssistantMessages(threadId);
  await sendSmokeTurn(request, threadId, "我最近有点烦。");
  await waitForLatestCompletedAssistantMessage(threadId, initialAssistantCount);

  await page.goto(
    `/api/test/smoke-login?secret=${smokeSecret}&redirect=/chat?thread=${threadId}`
  );
  await expect(page).toHaveURL(new RegExp(`thread=${threadId}`));
  await waitForHydratedThreadContext(page, threadId, [
    "我最近有点烦。",
    "好的，我已经记下来了，接下来可以继续帮你。"
  ]);

  return threadId;
}

test.describe("real runtime centralization", () => {
  test.skip(
    !hasServiceRole,
    "SUPABASE_SERVICE_ROLE_KEY is required to seed and inspect runtime test data."
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

  test("web chat sends through real runtime and persists governance metadata", async ({
    page,
    request
  }) => {
    const threadId = await createSmokeThread(request, "Smoke Guide");
    const previousAssistantCount = await countAssistantMessages(threadId);

    await page.goto(
      `/api/test/smoke-login?secret=${smokeSecret}&redirect=/chat?thread=${threadId}`
    );
    await expect(page).toHaveURL(new RegExp(`thread=${threadId}`));
    await assertComposerBoundToThread(page, threadId);

    await sendChatMessageThroughUi(page, "有点烦，想离开一下");
    await assertNoThreadFeedbackError(page);

    const latestAssistant = await waitForLatestCompletedAssistantMessage(
      threadId,
      previousAssistantCount
    );
    const governance = getGovernanceMetadata(latestAssistant.metadata);
    const userExplanation = getUserExplanationMetadata(latestAssistant.metadata);

    expect(governance).toBeTruthy();
    expect(userExplanation).toBeTruthy();
    expect(governance?.expression_brief ?? governance?.relational_brief).toBeTruthy();
    expect(userExplanation?.model_profile_name).toBeTruthy();
    expect(userExplanation?.memory_hit_count).not.toBeUndefined();

    await page.reload();
    await expect(page.getByText("有点烦，想离开一下").last()).toBeVisible({
      timeout: 30_000
    });
    await expect(page.getByText(latestAssistant.content).last()).toBeVisible({
      timeout: 30_000
    });
  });

  test("web chat keeps role background and persona anchors visible on the real runtime path", async ({
    page,
    request
  }) => {
    const threadId = await createSmokeThread(request, "Smoke Guide");
    const previousAssistantCount = await countAssistantMessages(threadId);

    await page.goto(
      `/api/test/smoke-login?secret=${smokeSecret}&redirect=/chat?thread=${threadId}`
    );
    await expect(page).toHaveURL(new RegExp(`thread=${threadId}`));
    await assertComposerBoundToThread(page, threadId);

    await sendChatMessageThroughUi(
      page,
      "Briefly introduce yourself and include a little of your background."
    );
    await assertNoThreadFeedbackError(page);

    const latestAssistant = await waitForLatestCompletedAssistantMessage(
      threadId,
      previousAssistantCount
    );
    const governance = getGovernanceMetadata(latestAssistant.metadata);
    const expressionBrief =
      governance && typeof governance.expression_brief === "string"
        ? governance.expression_brief
        : "";
    const relationalBrief =
      governance && typeof governance.relational_brief === "string"
        ? governance.relational_brief
        : "";

    expect(expressionBrief).toContain("Background anchor:");
    expect(relationalBrief).toContain(
      "include one concrete detail from this background anchor"
    );

    await page.reload();
    await expect(page.getByText(latestAssistant.content).last()).toBeVisible({
      timeout: 30_000
    });
  });

  test("web chat keeps explicit self-intro questions ahead of same-thread continuity on the real runtime path", async ({
    page,
    request
  }) => {
    const threadId = await prepareRolePresenceThread(page, request);
    const previousAssistantCount = await countAssistantMessages(threadId);

    await sendChatMessageThroughUi(page, "你先介绍一下你自己。");
    await assertNoThreadFeedbackError(page);

    const introAssistant = await waitForLatestCompletedAssistantMessage(
      threadId,
      previousAssistantCount
    );
    expect(getAnswerStrategyMetadata(introAssistant.metadata)).toEqual({
      questionType: "role-self-introduction",
      answerStrategy: "role-presence-first",
      answerStrategyReasonCode: "role-self-intro-prompt"
    });
    expect(introAssistant.content).toContain("我是 Memory Coach");
  });

  test("web chat keeps explicit capability questions ahead of same-thread continuity on the real runtime path", async ({
    page,
    request
  }) => {
    const threadId = await prepareRolePresenceThread(page, request);
    const previousAssistantCount = await countAssistantMessages(threadId);

    await sendChatMessageThroughUi(page, "你平时会怎么帮我？");
    await assertNoThreadFeedbackError(page);

    const capabilityAssistant = await waitForLatestCompletedAssistantMessage(
      threadId,
      previousAssistantCount
    );
    expect(getAnswerStrategyMetadata(capabilityAssistant.metadata)).toEqual({
      questionType: "role-capability",
      answerStrategy: "role-presence-first",
      answerStrategyReasonCode: "role-capability-prompt"
    });
    expect(capabilityAssistant.content).not.toContain("最堵的那一点");
    expect(capabilityAssistant.content).toContain("我平时会");
  });

  test("web chat keeps explicit background questions ahead of same-thread continuity on the real runtime path", async ({
    page,
    request
  }) => {
    const threadId = await prepareRolePresenceThread(page, request);
    const previousAssistantCount = await countAssistantMessages(threadId);

    await sendChatMessageThroughUi(page, "简单说说你的背景。");
    await assertNoThreadFeedbackError(page);

    const backgroundAssistant = await waitForLatestCompletedAssistantMessage(
      threadId,
      previousAssistantCount
    );
    expect(getAnswerStrategyMetadata(backgroundAssistant.metadata)).toEqual({
      questionType: "role-background",
      answerStrategy: "role-presence-first",
      answerStrategyReasonCode: "role-background-prompt"
    });
    expect(backgroundAssistant.content).toContain("陪伴");
  });

  test("web chat keeps explicit boundary questions ahead of same-thread continuity on the real runtime path", async ({
    page,
    request
  }) => {
    const threadId = await prepareRolePresenceThread(page, request);
    const previousAssistantCount = await countAssistantMessages(threadId);

    await sendChatMessageThroughUi(page, "你能做什么，不能做什么？");
    await assertNoThreadFeedbackError(page);

    const boundaryAssistant = await waitForLatestCompletedAssistantMessage(
      threadId,
      previousAssistantCount
    );
    expect(getAnswerStrategyMetadata(boundaryAssistant.metadata)).toEqual({
      questionType: "role-boundary",
      answerStrategy: "role-presence-first",
      answerStrategyReasonCode: "role-boundary-prompt"
    });
    expect(boundaryAssistant.content).toContain("我能");
    expect(boundaryAssistant.content).toContain("不能");
  });

  test("web chat clarify-before-action blocks image delivery on the real runtime path", async ({
    page,
    request
  }) => {
    const threadId = await createSmokeThread(request, "Smoke Guide");
    const previousAssistantCount = await countAssistantMessages(threadId);

    await page.goto(
      `/api/test/smoke-login?secret=${smokeSecret}&redirect=/chat?thread=${threadId}`
    );
    await expect(page).toHaveURL(new RegExp(`thread=${threadId}`));

    await sendChatMessageThroughUi(
      page,
      "去北海你建议吗？你有阿拉斯加的照片吗"
    );
    await assertNoThreadFeedbackError(page);

    const latestAssistant = await waitForLatestCompletedAssistantMessage(
      threadId,
      previousAssistantCount
    );
    const webDelivery = getWebDeliveryMetadata(latestAssistant.metadata);
    const artifacts = Array.isArray(latestAssistant.metadata.artifacts)
      ? latestAssistant.metadata.artifacts
      : [];

    expect(latestAssistant.content.trim().length).toBeGreaterThan(0);
    expect(webDelivery?.artifact_generation_status ?? null).not.toBe("completed");
    expect(
      artifacts.some((artifact) => {
        if (!artifact || typeof artifact !== "object") {
          return false;
        }

        const record = artifact as Record<string, unknown>;
        return record.type === "image" && record.status === "ready";
      })
    ).toBe(false);
  });

  test("web chat explicit image requests complete image delivery on the real runtime path", async ({
    page,
    request
  }) => {
    test.skip(
      true,
      "Positive image delivery needs a dedicated non-smoke billing-enabled fixture."
    );

    const threadId = await createSmokeThread(request, "Smoke Guide");
    const previousAssistantCount = await countAssistantMessages(threadId);

    await page.goto(
      `/api/test/smoke-login?secret=${smokeSecret}&redirect=/chat?thread=${threadId}`
    );
    await expect(page).toHaveURL(new RegExp(`thread=${threadId}`));

    await sendChatMessageThroughUi(
      page,
      "请生成一张上海天际线日出水彩风格的图片，并在回复里展示出来。"
    );
    await assertNoThreadFeedbackError(page);

    const latestAssistant = await waitForLatestCompletedAssistantMessage(
      threadId,
      previousAssistantCount
    );
    const webDelivery = getWebDeliveryMetadata(latestAssistant.metadata);
    const artifacts = Array.isArray(latestAssistant.metadata.artifacts)
      ? latestAssistant.metadata.artifacts
      : [];

    expect(webDelivery?.artifact_generation_status ?? null).toBe("completed");
    expect(
      artifacts.some((artifact) => {
        if (!artifact || typeof artifact !== "object") {
          return false;
        }

        const record = artifact as Record<string, unknown>;
        return (
          record.type === "image" &&
          record.status === "ready" &&
          typeof record.url === "string" &&
          record.url.length > 0
        );
      })
    ).toBe(true);

    await waitForAssistantImageArtifactInUi(
      page,
      threadId,
      "image-flux-2-klein-4b"
    );
  });
});
