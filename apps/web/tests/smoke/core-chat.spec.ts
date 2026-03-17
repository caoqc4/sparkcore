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

    const latestSummaryHeading = page
      .locator("summary")
      .filter({ hasText: "How this reply was generated" })
      .last();
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

    const latestSummaryHeading = page
      .locator("summary")
      .filter({ hasText: "How this reply was generated" })
      .last();
    await latestSummaryHeading.click();
    await expect(page.getByText(/1 memory hit/)).toBeVisible({
      timeout: 45_000
    });
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

    const secondThreadResponse = await request.post("/api/test/smoke-create-thread", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        agentName: "Smoke Guide"
      }
    });

    expect(secondThreadResponse.ok()).toBeTruthy();
    const { threadId: englishThreadId } = (await secondThreadResponse.json()) as {
      threadId: string;
    };

    await page.goto(
      `/api/test/smoke-login?secret=${smokeSecret}&redirect=/chat?thread=${englishThreadId}`
    );

    const enTurnResponse = await request.post("/api/test/smoke-send-turn", {
      headers: {
        "x-smoke-secret": smokeSecret,
        "Content-Type": "application/json"
      },
      data: {
        threadId: englishThreadId,
        content:
          "Please introduce yourself in two short sentences and explain how you can help me."
      }
    });

    expect(enTurnResponse.ok()).toBeTruthy();
    await page.reload();
    await expect(page.getByText("I am SparkCore").first()).toBeVisible({
      timeout: 45_000
    });
  });
});
