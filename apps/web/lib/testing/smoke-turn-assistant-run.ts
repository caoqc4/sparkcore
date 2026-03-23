import { persistPreparedSmokeAssistantTurn } from "@/lib/testing/smoke-turn-assistant-persistence";
import {
  buildSmokePersistedAssistantTurnInput,
  buildSmokePreparedAssistantTurn
} from "@/lib/testing/smoke-turn-assistant-run-builders";
import type { SmokeAssistantTurnRunInput } from "@/lib/testing/smoke-turn-assistant-run-types";

export async function runSmokeAssistantTurnStep(args: SmokeAssistantTurnRunInput) {
  const preparedAssistantTurn = buildSmokePreparedAssistantTurn(args);

  return persistPreparedSmokeAssistantTurn(
    buildSmokePersistedAssistantTurnInput({
      run: args,
      preparedAssistantTurn
    })
  );
}
