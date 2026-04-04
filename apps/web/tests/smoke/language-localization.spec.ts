import { expect, test, type Page } from "@playwright/test";

const smokeSecret = process.env.PLAYWRIGHT_SMOKE_SECRET ?? "sparkcore-smoke-local";

async function getMetaDescription(page: Page) {
  return page.locator('meta[name="description"]').getAttribute("content");
}

test.describe("language localization smoke", () => {
  test("switches homepage content language to Chinese and updates metadata", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Create an AI companion that remembers you." })
    ).toBeVisible();
    await expect(page).toHaveTitle(
      "AI Companion That Remembers You and Stays With You in IM | Lagun"
    );
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(await getMetaDescription(page)).toBe(
      "Meet your AI companion who actually remembers you. Long memory, IM-native relationship loop, and a web control center for memory, privacy, and channel settings."
    );

    await page
      .locator(".language-switch")
      .getByRole("button", { name: "中文", exact: true })
      .click();

    await expect(
      page.getByRole("heading", { name: "创建一个会记住你的 AI 陪伴。" })
    ).toBeVisible();
    await expect(page).toHaveTitle("会记住你、并在 IM 中持续陪伴你的 AI 陪伴 | Lagun");
    await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
    await expect(await getMetaDescription(page)).toBe(
      "认识一个真正会记住你的 AI 陪伴。长期记忆、IM 原生关系循环，以及用于记忆、隐私和渠道设置的网页控制中心。"
    );
  });

  test("uses one site language setting inside the console", async ({
    page,
  }) => {
    const languageForm = page.locator("form").filter({
      has: page.locator('select[name="language"]'),
    });

    await page.goto(`/api/test/smoke-login?secret=${smokeSecret}&redirect=/app/settings`);

    await expect(page).toHaveURL(/\/app\/settings/);
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page).toHaveTitle("App Console | Lagun");

    await page.locator('select[name="language"]').selectOption("zh-CN");
    await languageForm.getByRole("button", { name: "Save language" }).click();

    await expect(page.getByText("语言已保存。")).toBeVisible();
    await expect(page.getByRole("heading", { name: "设置" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
    await expect(page).toHaveTitle("应用控制台 | Lagun");
    await expect(page.locator('select[name="language"]')).toHaveValue("zh-CN");

    await page.locator('select[name="language"]').selectOption("en");
    await languageForm.getByRole("button", { name: "保存语言" }).click();

    await expect(page.getByText("Language saved.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page).toHaveTitle("App Console | Lagun");
    await expect(page.locator('select[name="language"]')).toHaveValue("en");
  });

  test("keeps console language following homepage content language for signed-in users", async ({
    page,
  }) => {
    const languageForm = page.locator("form").filter({
      has: page.locator('select[name="language"]'),
    });

    await page.goto(`/api/test/smoke-login?secret=${smokeSecret}&redirect=/app/settings`);
    await page.locator('select[name="language"]').selectOption("en");
    await languageForm.getByRole("button", { name: "Save language" }).click();
    await expect(page.getByText("Language saved.")).toBeVisible();

    await page.goto("/");
    await page
      .locator(".language-switch")
      .getByRole("button", { name: "中文", exact: true })
      .click();

    await expect(
      page.getByRole("heading", { name: "创建一个会记住你的 AI 陪伴。" })
    ).toBeVisible();

    await page.goto("/app/settings");
    await expect(page.getByRole("heading", { name: "设置" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
    await expect(page).toHaveTitle("应用控制台 | Lagun");
  });
});
