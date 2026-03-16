import { expect, test } from "@playwright/test";

const smokeSecret = process.env.PLAYWRIGHT_SMOKE_SECRET ?? "sparkcore-smoke-local";
const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

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
    page
  }) => {
    await expect(page.getByText("No threads yet")).toBeVisible();
    await expect(
      page.getByRole("option", { name: "Smoke Guide" }).first()
    ).toBeVisible();

    await page.getByRole("button", { name: "New chat" }).click();
    await expect(page).toHaveURL(/\/chat\?thread=/);

    const threadOneId = new URL(page.url()).searchParams.get("thread");
    expect(threadOneId).toBeTruthy();

    await page
      .getByLabel("Message")
      .fill("I am a product designer and I prefer concise weekly planning.");
    await page.getByRole("button", { name: "Send message" }).click();

    await expect(
      page.getByRole("heading", { name: "How this reply was generated" }).first()
    ).toBeVisible({ timeout: 45_000 });
    await expect(page.getByText(/Saved new/i)).toBeVisible({ timeout: 45_000 });

    await page
      .getByLabel("Message")
      .fill(
        "What profession do you remember that I work in? If you don't know, say you don't know."
      );
    await page.getByRole("button", { name: "Send message" }).click();

    await expect(page.getByText(/memory hit/i).first()).toBeVisible({
      timeout: 45_000
    });
    await expect(page.getByText(/This turn used profile memory\./)).toBeVisible({
      timeout: 45_000
    });

    await page.selectOption('select[name="agent_id"]', { label: "Smoke Memory Coach" });
    await page.getByRole("button", { name: "New chat" }).click();
    await expect(page).toHaveURL(/\/chat\?thread=/);

    const threadTwoId = new URL(page.url()).searchParams.get("thread");
    expect(threadTwoId).toBeTruthy();
    expect(threadTwoId).not.toBe(threadOneId);

    await page
      .locator(`a[href="/chat?thread=${threadOneId}"]`)
      .click();
    await expect(page).toHaveURL(new RegExp(`thread=${threadOneId}`));

    await page.reload();
    await expect(page).toHaveURL(new RegExp(`thread=${threadOneId}`));
    await expect(
      page.locator(`a[href="/chat?thread=${threadOneId}"][aria-current="page"]`)
    ).toBeVisible();
  });

  test("covers memory correction controls and agent defaults/model profile changes", async ({
    page
  }) => {
    await page.getByRole("button", { name: "New chat" }).click();
    await expect(page).toHaveURL(/\/chat\?thread=/);

    await page
      .getByLabel("Message")
      .fill("I am a product designer and I prefer concise weekly planning.");
    await page.getByRole("button", { name: "Send message" }).click();

    const profileMemoryCard = page
      .locator(".memory-list:not(.memory-list-hidden) .memory-card")
      .filter({ hasText: "product designer" })
      .first();

    await expect(profileMemoryCard).toBeVisible({ timeout: 45_000 });

    await profileMemoryCard.getByRole("button", { name: "Hide" }).click();
    await expect(page.getByText(/Hidden memories \(1\)/)).toBeVisible();
    await expect(profileMemoryCard).toHaveCount(0);

    const hiddenMemoryCard = page
      .locator(".memory-card-hidden")
      .filter({ hasText: "product designer" })
      .first();

    await hiddenMemoryCard.getByRole("button", { name: "Restore" }).click();
    await expect(
      page
        .locator(".memory-list:not(.memory-list-hidden) .memory-card")
        .filter({ hasText: "product designer" })
        .first()
    ).toBeVisible();

    const restoredMemoryCard = page
      .locator(".memory-list:not(.memory-list-hidden) .memory-card")
      .filter({ hasText: "product designer" })
      .first();
    await restoredMemoryCard.getByRole("button", { name: "Incorrect" }).click();

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
    await expect(page.getByText("Workspace default agent updated.")).toBeVisible();

    await expect(
      page.locator('select[name="agent_id"] option:checked')
    ).toHaveText(/Smoke Memory Coach/);

    const smokeGuideCard = page
      .locator(".agent-card")
      .filter({ hasText: "Smoke Guide" })
      .first();

    await smokeGuideCard.getByRole("button", { name: "Edit" }).click();
    const smokeAltValue = await page
      .getByLabel("Model profile")
      .locator("option")
      .filter({ hasText: "Smoke Alt" })
      .first()
      .getAttribute("value");

    expect(smokeAltValue).toBeTruthy();
    await page.getByLabel("Model profile").selectOption(smokeAltValue!);
    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(smokeGuideCard.getByText(/Model profile: Smoke Alt/)).toBeVisible();

    await page
      .getByLabel("Message")
      .fill("Reply in one sentence with a quick hello.");
    await page.getByRole("button", { name: "Send message" }).click();

    await expect(page.getByText("Smoke Alt").first()).toBeVisible({
      timeout: 45_000
    });
  });
});
