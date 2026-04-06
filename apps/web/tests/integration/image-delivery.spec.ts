import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const smokeSecret =
  process.env.PLAYWRIGHT_SMOKE_SECRET ?? "sparkcore-smoke-local";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

type AssistantMessageRecord = {
  id: string;
  content: string;
  status: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

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

function getWebDeliveryMetadata(
  metadata: Record<string, unknown> | null | undefined
) {
  return getMetadataObject(metadata?.web_delivery);
}

async function resetSmokeState(request: APIRequestContext) {
  const response = await request.post("/api/test/smoke-reset", {
    headers: {
      "x-smoke-secret": smokeSecret
    }
  });

  expect(response.ok()).toBe(true);
}

async function createSmokeThread(request: APIRequestContext, agentName: string) {
  const response = await request.post("/api/test/smoke-create-thread", {
    headers: {
      "x-smoke-secret": smokeSecret,
      "Content-Type": "application/json"
    },
    data: { agentName }
  });

  expect(response.ok()).toBe(true);
  const payload = (await response.json()) as { threadId: string };
  expect(payload.threadId).toBeTruthy();
  return payload.threadId;
}

async function signIntoSmokeThread(page: Page, threadId: string) {
  await page.goto(
    `/api/test/smoke-login?secret=${smokeSecret}&redirect=/chat?thread=${threadId}`
  );
  await expect(page).toHaveURL(new RegExp(`thread=${threadId}`));
}

async function sendChatMessageThroughUi(page: Page, content: string) {
  const textarea = page.locator('textarea[name="content"]');
  const sendButton = page.getByRole("button", { name: /send message/i });

  await expect(textarea).toBeVisible();
  await expect(textarea).toBeEditable();
  await expect(sendButton).toBeEnabled();

  await textarea.fill(content);
  await sendButton.click();

  await Promise.race([
    sendButton.waitFor({ state: "detached", timeout: 10_000 }),
    expect(sendButton).toBeDisabled({ timeout: 10_000 })
  ]).catch(() => null);
}

async function waitForAssistantImageArtifact(threadId: string) {
  const admin = getSmokeAdminClient();
  const startedAt = Date.now();

  while (Date.now() - startedAt < 180_000) {
    const { data, error } = await admin
      .from("messages")
      .select("id, content, status, metadata, created_at")
      .eq("thread_id", threadId)
      .eq("role", "assistant")
      .order("created_at", { ascending: true });

    expect(error).toBeNull();

    const assistantMessages = (data ?? []) as AssistantMessageRecord[];
    const latestAssistant = assistantMessages.at(-1) ?? null;

    if (!latestAssistant) {
      await pageWait(1000);
      continue;
    }

    const artifacts = Array.isArray(latestAssistant.metadata.artifacts)
      ? latestAssistant.metadata.artifacts
      : [];
    const readyImage = artifacts.find((artifact) => {
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
    });
    const webDelivery = getWebDeliveryMetadata(latestAssistant.metadata);

    if (readyImage) {
      return {
        latestAssistant,
        imageArtifact: readyImage as Record<string, unknown>,
        webDelivery
      };
    }

    if (webDelivery?.artifact_generation_status === "failed") {
      throw new Error(
        `Image delivery failed: ${String(webDelivery.artifact_generation_error ?? "unknown")}`
      );
    }

    await pageWait(1000);
  }

  throw new Error(`Timed out waiting for an image artifact in thread ${threadId}.`);
}

async function waitForAssistantImageInUi(page: Page, threadId: string) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    await page.goto(
      `/api/test/smoke-login?secret=${smokeSecret}&redirect=/chat?thread=${threadId}`
    );
    await expect(page).toHaveURL(new RegExp(`thread=${threadId}`));

    const image = page.locator(".message-assistant img").last();
    const imageCount = await image.count();

    if (imageCount > 0) {
      await expect(image).toBeVisible();
      return image;
    }

    await pageWait(2000);
  }

  throw new Error(`Timed out waiting for the image artifact to appear in the UI.`);
}

function pageWait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

test.describe("real provider image delivery", () => {
  test("web chat explicit image requests render the generated image in the UI", async ({
    page,
    request
  }) => {
    test.setTimeout(240_000);

    await resetSmokeState(request);
    const threadId = await createSmokeThread(request, "Smoke Guide");

    await signIntoSmokeThread(page, threadId);
    await sendChatMessageThroughUi(
      page,
      "请生成一张上海天际线日出水彩风格的图片，并在回复里展示出来。"
    );

    const { latestAssistant, imageArtifact, webDelivery } =
      await waitForAssistantImageArtifact(threadId);

    expect(latestAssistant.content.trim().length).toBeGreaterThan(0);
    expect(webDelivery?.explicit_image_requested ?? null).toBe(true);
    expect(["running", "completed"]).toContain(
      webDelivery?.artifact_generation_status ?? null
    );
    expect(imageArtifact.modelSlug).toBe("image-flux-2-klein-4b");

    const image = await waitForAssistantImageInUi(page, threadId);
    await expect(image).toHaveAttribute("src", String(imageArtifact.url));
    await expect(image).toHaveAttribute(
      "alt",
      /上海天际线日出水彩风格的图片|Smoke Guide image based on/
    );
    await expect(page.locator(".message-assistant figcaption").last()).toContainText(
      "image-flux-2-klein-4b"
    );
  });
});
