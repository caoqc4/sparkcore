import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const smokeSecret = process.env.PLAYWRIGHT_SMOKE_SECRET ?? "sparkcore-smoke-local";
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
  const { data, error } = await admin
    .from("channel_bindings")
    .select("platform, status, channel_id, peer_id")
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
    const resetResponse = await request.post("/api/test/smoke-reset", {
      headers: {
        "x-smoke-secret": smokeSecret
      }
    });

    expect(resetResponse.ok()).toBeTruthy();
  });

  test("creates a product role, binds telegram, and lands on dashboard", async ({
    page
  }) => {
    await page.goto(`/api/test/smoke-login?secret=${smokeSecret}&redirect=/create`);
    await expect(page).toHaveURL(/\/create/);

    await page.getByLabel("Name").fill("Flow Smoke Role");
    await page.getByLabel("Relationship mode").fill("daily supportive companion");
    await page.getByRole("button", { name: "Create and continue" }).click();

    await expect(page).toHaveURL(/\/connect-im/);
    await expect(page.getByText("Role and thread created.")).toBeVisible();

    await page.getByRole("textbox", { name: "Channel ID" }).fill("smoke-telegram-chat-1");
    await page.getByRole("textbox", { name: "Peer ID" }).fill("smoke-telegram-user-1");
    await page.getByRole("button", { name: "Save Telegram binding" }).click();

    await expect(
      page.getByText(
        "Telegram binding saved. Your relationship thread is now attached to an IM channel."
      )
    ).toBeVisible();

    await page.getByRole("link", { name: "Open dashboard" }).click();
    await expect(page).toHaveURL(/\/app/);
    await expect(page.getByText("Relationship summary")).toBeVisible();
    await expect(page.getByText(/1 active \/ 1 total binding\(s\)/)).toBeVisible();
    await page.getByRole("link", { name: "Open privacy page" }).click();
    await expect(page).toHaveURL(/\/app\/privacy/);
    await expect(
      page.getByRole("heading", {
        name: "See what you can control now, without pretending hidden systems already exist."
      })
    ).toBeVisible();
    await expect(page.getByText("Memory source drill-down")).toBeVisible();
    await page.goto("/app");
    await page.getByRole("link", { name: "Open supplementary chat" }).click();
    await expect(page).toHaveURL(/\/app\/chat/);
    await expect(
      page.getByRole("heading", { name: "Continue the same relationship thread from the web." })
    ).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Message" })).toBeVisible();
    await expect(page.getByText("1 active channel(s)")).toBeVisible();

    const bindings = await getActiveSmokeBindings();
    expect(bindings).toHaveLength(1);
    expect(bindings[0]).toMatchObject({
      platform: "telegram",
      status: "active",
      channel_id: "smoke-telegram-chat-1",
      peer_id: "smoke-telegram-user-1"
    });
  });
});
