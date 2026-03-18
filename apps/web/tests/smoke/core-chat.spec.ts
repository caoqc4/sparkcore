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

    const latestSummaryHeading = page
      .locator("summary")
      .filter({ hasText: "How this reply was generated" })
      .last();
    await latestSummaryHeading.click();
    await expect(page.getByText(/1 memory hit/)).toBeVisible({
      timeout: 45_000
    });
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

    const latestSummaryHeading = page
      .locator("summary")
      .filter({ hasText: "How this reply was generated" })
      .last();
    await latestSummaryHeading.click();
    await expect(page.getByText("This turn used relationship memory.")).toBeVisible({
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

    const latestSummaryHeading = page
      .locator("summary")
      .filter({ hasText: "How this reply was generated" })
      .last();
    await latestSummaryHeading.click();
    await expect(page.getByText("This turn used relationship memory.")).toBeVisible({
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

    const latestSummaryHeading = page
      .locator("summary")
      .filter({ hasText: "How this reply was generated" })
      .last();
    await latestSummaryHeading.click();
    await expect(page.getByText("This turn used relationship memory.")).toBeVisible({
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

    const latestSummaryHeading = page
      .locator("summary")
      .filter({ hasText: "How this reply was generated" })
      .last();
    await latestSummaryHeading.click();
    await expect(page.getByText("This turn used relationship memory.")).toBeVisible({
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
  });
});
