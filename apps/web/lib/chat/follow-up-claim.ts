import type {
  ClaimDuePendingFollowUpsInput,
  ClaimDuePendingFollowUpsResult,
  FollowUpRepository
} from "@/lib/chat/runtime-contract";

export async function claimDuePendingFollowUps({
  repository,
  now = new Date().toISOString(),
  limit,
  claimed_by,
  claim_token
}: {
  repository: FollowUpRepository;
  now?: string;
  limit: number;
  claimed_by: string;
  claim_token?: string;
}): Promise<ClaimDuePendingFollowUpsResult> {
  const input: ClaimDuePendingFollowUpsInput = {
    now,
    limit,
    claimed_by,
    claim_token
  };

  return repository.claimDuePendingFollowUps(input);
}
