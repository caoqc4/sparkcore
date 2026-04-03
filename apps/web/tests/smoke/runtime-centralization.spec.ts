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
  const response = await request.post("/api/test/smoke-create-thread", {
    headers: {
      "x-smoke-secret": smokeSecret,
      "Content-Type": "application/json"
    },
    data: { agentName }
  });

  expect(response.ok()).toBeTruthy();

  const payload = (await response.json()) as { threadId: string };
  expect(payload.threadId).toBeTruthy();
  return payload.threadId;
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
  const { count, error } = await withSupabaseRetry(async () =>
    admin
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("thread_id", threadId)
      .eq("role", "assistant")
  );

  expect(error).toBeNull();
  return count ?? 0;
}

async function sendChatMessageThroughUi(page: Page, content: string) {
  await page.locator('textarea[name="content"]').fill(content);
  await page.getByRole("button", { name: /send message/i }).click();
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

    await sendChatMessageThroughUi(page, "有点烦，想离开一下");

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
});
