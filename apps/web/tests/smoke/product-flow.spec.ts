import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { resetSmokeStateWithRetry } from "@/tests/helpers/smoke-reset";

const smokeSecret = process.env.PLAYWRIGHT_SMOKE_SECRET ?? "sparkcore-smoke-local";
const smokeEmail = process.env.PLAYWRIGHT_SMOKE_EMAIL ?? "smoke@example.com";
const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

function getSmokeAdminClient() {
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

async function getActiveSmokeBindings() {
  const admin = getSmokeAdminClient();
  const { data: usersData, error: usersError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200
  });

  expect(usersError).toBeNull();

  const smokeUserId =
    usersData?.users.find((user) => user.email === smokeEmail)?.id ?? null;

  expect(smokeUserId).toBeTruthy();

  const { data, error } = await admin
    .from("channel_bindings")
    .select("platform, status, channel_id, peer_id")
    .eq("user_id", smokeUserId)
    .eq("status", "active");

  expect(error).toBeNull();
  return data ?? [];
}

test.describe("product flow smoke", () => {
  test.skip(
    !hasServiceRole,
    "SUPABASE_SERVICE_ROLE_KEY is required to seed and reset the smoke workspace."
  );

  test.beforeEach(async ({ request }) => {
    await resetSmokeStateWithRetry(request, smokeSecret);
  });

  test("creates a product role, binds telegram, and lands on dashboard", async ({
    page
  }) => {
    await page.goto(`/api/test/smoke-login?secret=${smokeSecret}&redirect=/app/create`);
    await expect(page).toHaveURL(/\/app\/create/);

    await page.getByLabel("Name").fill("Flow Smoke Role");
    await page.getByRole("button", { name: "Next — Personality →" }).click();
    await page.getByLabel("Relationship mode").fill("daily supportive companion");
    await page.getByRole("button", { name: "Next — Choose look →" }).click();
    await page.getByRole("button", { name: "Create Flow Smoke Role →" }).click();

    await expect(page).toHaveURL(/\/app\/role/);
    await expect(page.getByText("Flow Smoke Role created")).toBeVisible();

    const roleUrl = new URL(page.url());
    const roleId = roleUrl.searchParams.get("role");
    expect(roleId).toBeTruthy();

    await page.goto(`/app/channels?role=${encodeURIComponent(roleId!)}`);
    await expect(page.getByRole("heading", { name: "IM Connections" })).toBeVisible();
    await page.getByRole("link", { name: "Connect", exact: true }).click();

    await expect(page).toHaveURL(/\/connect-im/);

    await page.getByRole("textbox", { name: "Chat ID" }).fill("smoke-telegram-chat-1");
    await page.getByRole("textbox", { name: "User ID" }).fill("smoke-telegram-user-1");
    await page.getByRole("button", { name: "Connect Telegram" }).click();

    await expect(
      page.getByText(
        "Telegram connected. You can now chat via the bot."
      )
    ).toBeVisible();

    await page.goto(`/app/chat?role=${encodeURIComponent(roleId!)}`);
    await expect(page).toHaveURL(/\/app\/chat/);
    await expect(page.getByText("No messages yet")).toBeVisible();
    await expect(
      page.getByText("Send a message to continue this relationship thread.")
    ).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Message... (paste image to preview)" })).toBeVisible();

    const bindings = await getActiveSmokeBindings();
    expect(bindings).toHaveLength(1);
    expect(bindings[0]).toMatchObject({
      platform: "telegram",
      status: "active",
      channel_id: "smoke-telegram-chat-1",
      peer_id: "smoke-telegram-user-1"
    });
  });

  test("shows preset entrypoints and restore defaults affordance for preset-based roles", async ({
    page
  }) => {
    await page.goto(`/api/test/smoke-login?secret=${smokeSecret}&redirect=/app/create?preset=caria`);
    await expect(page).toHaveURL(/\/app\/create\?preset=caria/);

    await expect(page.getByText("Choose a starting point")).toBeVisible();
    await page.getByRole("button", { name: "Next — Personality →" }).click();
    await page.getByRole("button", { name: "Next — Choose look →" }).click();
    await page.getByRole("button", { name: "Create Caria →" }).click();
    await expect(page).toHaveURL(/\/app\/role/);

    await expect(page.getByText(/Based on Caria Preset/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Restore defaults" })).toBeVisible();
  });
});
