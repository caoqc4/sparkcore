import { expect, type APIRequestContext } from "@playwright/test";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function resetSmokeStateWithRetry(
  request: APIRequestContext,
  smokeSecret: string
) {
  let lastStatus = "unknown";
  let lastBody = "";

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await request.post("/api/test/smoke-reset", {
      headers: {
        "x-smoke-secret": smokeSecret
      }
    });

    if (response.ok()) {
      return;
    }

    lastStatus = String(response.status());
    lastBody = await response.text();

    if (attempt < 3) {
      await sleep(500 * (attempt + 1));
    }
  }

  expect(
    false,
    `Smoke reset failed after retries. status=${lastStatus} body=${lastBody.slice(0, 500)}`
  ).toBeTruthy();
}
