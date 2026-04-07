import { retryOnceOnTransientSupabaseFetch } from "@/lib/supabase/transient-fetch";

export const DEFAULT_IM_INBOUND_JOBS_TABLE = "im_inbound_jobs";
const STALE_CLAIM_TIMEOUT_MS = 2 * 60 * 1000;
const STALE_PROCESSING_TIMEOUT_MS = 10 * 60 * 1000;

export type ImInboundJobType = "telegram_inbound_turn";

export type ImInboundJobStatus =
  | "queued"
  | "claimed"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export type ImInboundJobRecord = {
  id: string;
  receipt_id: string;
  platform: string;
  channel_slug: string;
  job_type: string;
  status: ImInboundJobStatus;
  attempt_count: number;
  claimed_by: string | null;
  claimed_at: string | null;
  available_at: string;
  started_at: string | null;
  completed_at: string | null;
  failed_at: string | null;
  last_error: string | null;
  payload: Record<string, unknown> | null;
  result: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

function asRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

const IM_INBOUND_JOB_SELECT =
  "id, receipt_id, platform, channel_slug, job_type, status, attempt_count, claimed_by, claimed_at, available_at, started_at, completed_at, failed_at, last_error, payload, result, created_at, updated_at";

function toIsoString(value: number) {
  return new Date(value).toISOString();
}

async function recycleStaleClaimedImInboundJobs(args: {
  supabase: any;
  jobType: ImInboundJobType;
  staleClaimedBefore: string;
  platform?: string;
  channelSlug?: string;
}) {
  let query = args.supabase
    .from(DEFAULT_IM_INBOUND_JOBS_TABLE)
    .update({
      status: "queued" as const,
      claimed_by: null,
      claimed_at: null,
      available_at: new Date().toISOString(),
      last_error: "stale_claim_requeued"
    })
    .eq("status", "claimed")
    .eq("job_type", args.jobType)
    .lt("claimed_at", args.staleClaimedBefore)
    .is("started_at", null)
    .select("id");

  if (args.platform) {
    query = query.eq("platform", args.platform);
  }

  if (args.channelSlug) {
    query = query.eq("channel_slug", args.channelSlug);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to recycle stale IM inbound claims: ${error.message}`);
  }

  return Array.isArray(data) ? data.length : 0;
}

async function recycleStaleProcessingImInboundJobs(args: {
  supabase: any;
  jobType: ImInboundJobType;
  staleStartedBefore: string;
  platform?: string;
  channelSlug?: string;
}) {
  let query = args.supabase
    .from(DEFAULT_IM_INBOUND_JOBS_TABLE)
    .update({
      status: "queued" as const,
      claimed_by: null,
      claimed_at: null,
      started_at: null,
      available_at: new Date().toISOString(),
      last_error: "stale_processing_requeued"
    })
    .eq("status", "processing")
    .eq("job_type", args.jobType)
    .lt("started_at", args.staleStartedBefore)
    .is("completed_at", null)
    .select("id");

  if (args.platform) {
    query = query.eq("platform", args.platform);
  }

  if (args.channelSlug) {
    query = query.eq("channel_slug", args.channelSlug);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to recycle stale IM inbound processing jobs: ${error.message}`);
  }

  return Array.isArray(data) ? data.length : 0;
}

export async function enqueueImInboundJob(args: {
  supabase: any;
  receiptId: string;
  platform: string;
  channelSlug: string;
  jobType: ImInboundJobType;
  payload?: Record<string, unknown>;
  availableAt?: string;
}) {
  const payload = {
    receipt_id: args.receiptId,
    platform: args.platform,
    channel_slug: args.channelSlug,
    job_type: args.jobType,
    status: "queued" as const,
    attempt_count: 0,
    payload: args.payload ?? {},
    result: {},
    available_at: args.availableAt ?? new Date().toISOString()
  };

  const { data, error } = await args.supabase
    .from(DEFAULT_IM_INBOUND_JOBS_TABLE)
    .insert(payload)
    .select(IM_INBOUND_JOB_SELECT)
    .single();

  if (!error && data) {
    return {
      status: "enqueued" as const,
      job: data as ImInboundJobRecord
    };
  }

  const isDuplicate = error?.code === "23505";
  if (!isDuplicate) {
    throw new Error(error?.message ?? "Failed to enqueue IM inbound job.");
  }

  const { data: existing, error: existingError } = await args.supabase
    .from(DEFAULT_IM_INBOUND_JOBS_TABLE)
    .select(IM_INBOUND_JOB_SELECT)
    .eq("receipt_id", args.receiptId)
    .eq("job_type", args.jobType)
    .maybeSingle();

  if (existingError || !existing) {
    throw new Error(
      existingError?.message ?? "Failed to load duplicate IM inbound job."
    );
  }

  return {
    status: "duplicate" as const,
    job: existing as ImInboundJobRecord
  };
}

export async function claimQueuedImInboundJobs(args: {
  supabase: any;
  jobType: ImInboundJobType;
  limit: number;
  claimedBy: string;
  now?: string;
  platform?: string;
  channelSlug?: string;
}) {
  const now = args.now ?? new Date().toISOString();
  const staleClaimedBefore = toIsoString(
    Date.parse(now) - STALE_CLAIM_TIMEOUT_MS
  );
  const staleStartedBefore = toIsoString(
    Date.parse(now) - STALE_PROCESSING_TIMEOUT_MS
  );
  let queuedRows: ImInboundJobRecord[] | null = null;

  try {
    await recycleStaleClaimedImInboundJobs({
      supabase: args.supabase,
      jobType: args.jobType,
      staleClaimedBefore,
      platform: args.platform,
      channelSlug: args.channelSlug
    });
    await recycleStaleProcessingImInboundJobs({
      supabase: args.supabase,
      jobType: args.jobType,
      staleStartedBefore,
      platform: args.platform,
      channelSlug: args.channelSlug
    });

    const result = await retryOnceOnTransientSupabaseFetch({
      task: async () => {
        let query = args.supabase
          .from(DEFAULT_IM_INBOUND_JOBS_TABLE)
          .select(IM_INBOUND_JOB_SELECT)
          .eq("status", "queued")
          .eq("job_type", args.jobType)
          .lte("available_at", now);

        if (args.platform) {
          query = query.eq("platform", args.platform);
        }

        if (args.channelSlug) {
          query = query.eq("channel_slug", args.channelSlug);
        }

        return query
          .order("available_at", { ascending: true })
          .order("created_at", { ascending: true })
          .limit(args.limit);
      }
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    queuedRows = (result.data ?? []) as ImInboundJobRecord[];
  } catch (loadError) {
    throw new Error(
      `Failed to load queued IM inbound jobs: ${
        loadError instanceof Error ? loadError.message : String(loadError)
      }`
    );
  }

  const rows = queuedRows ?? [];
  if (rows.length === 0) {
    return {
      claimed_count: 0,
      jobs: [] as ImInboundJobRecord[]
    };
  }

  const claimedAt = new Date().toISOString();
  const startedAt = claimedAt;
  const claimResults = await Promise.all(
    rows.map(async (row) => {
      const { data, error } = await args.supabase
        .from(DEFAULT_IM_INBOUND_JOBS_TABLE)
        .update({
          status: "processing",
          claimed_by: args.claimedBy,
          claimed_at: claimedAt,
          started_at: startedAt,
          attempt_count: (row.attempt_count ?? 0) + 1
        })
        .eq("id", row.id)
        .eq("status", "queued")
        .select(IM_INBOUND_JOB_SELECT)
        .maybeSingle();

      if (error) {
        throw new Error(`Failed to claim IM inbound job ${row.id}: ${error.message}`);
      }

      return data ? (data as ImInboundJobRecord) : null;
    })
  );

  const jobs = claimResults.filter((job): job is ImInboundJobRecord => job !== null);

  return {
    claimed_count: jobs.length,
    jobs
  };
}

export async function markImInboundJobProcessing(args: {
  supabase: any;
  jobId: string;
  resultPatch?: Record<string, unknown>;
}) {
  const { data: current } = await args.supabase
    .from(DEFAULT_IM_INBOUND_JOBS_TABLE)
    .select("result")
    .eq("id", args.jobId)
    .maybeSingle();

  const currentResult = asRecord(current?.result) ?? {};
  const startedAt = new Date().toISOString();

  const { data, error } = await args.supabase
    .from(DEFAULT_IM_INBOUND_JOBS_TABLE)
    .update({
      status: "processing",
      started_at: startedAt,
      result: {
        ...currentResult,
        ...(args.resultPatch ?? {})
      }
    })
    .eq("id", args.jobId)
    .select(IM_INBOUND_JOB_SELECT)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to mark IM inbound job processing: ${error.message}`);
  }

  return data ? (data as ImInboundJobRecord) : null;
}

export async function markImInboundJobCompleted(args: {
  supabase: any;
  jobId: string;
  resultPatch?: Record<string, unknown>;
}) {
  const { data: current } = await args.supabase
    .from(DEFAULT_IM_INBOUND_JOBS_TABLE)
    .select("result")
    .eq("id", args.jobId)
    .maybeSingle();

  const currentResult = asRecord(current?.result) ?? {};
  const completedAt = new Date().toISOString();

  const { data, error } = await args.supabase
    .from(DEFAULT_IM_INBOUND_JOBS_TABLE)
    .update({
      status: "completed",
      completed_at: completedAt,
      last_error: null,
      result: {
        ...currentResult,
        ...(args.resultPatch ?? {})
      }
    })
    .eq("id", args.jobId)
    .select(IM_INBOUND_JOB_SELECT)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to mark IM inbound job completed: ${error.message}`);
  }

  return data ? (data as ImInboundJobRecord) : null;
}

export async function markImInboundJobFailed(args: {
  supabase: any;
  jobId: string;
  errorMessage: string;
  resultPatch?: Record<string, unknown>;
  nextAvailableAt?: string | null;
}) {
  const { data: current } = await args.supabase
    .from(DEFAULT_IM_INBOUND_JOBS_TABLE)
    .select("result")
    .eq("id", args.jobId)
    .maybeSingle();

  const currentResult = asRecord(current?.result) ?? {};
  const failedAt = new Date().toISOString();

  const nextStatus: ImInboundJobStatus = args.nextAvailableAt ? "queued" : "failed";
  const { data, error } = await args.supabase
    .from(DEFAULT_IM_INBOUND_JOBS_TABLE)
    .update({
      status: nextStatus,
      failed_at: failedAt,
      available_at: args.nextAvailableAt ?? undefined,
      last_error: args.errorMessage,
      result: {
        ...currentResult,
        ...(args.resultPatch ?? {})
      }
    })
    .eq("id", args.jobId)
    .select(IM_INBOUND_JOB_SELECT)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to mark IM inbound job failed: ${error.message}`);
  }

  return data ? (data as ImInboundJobRecord) : null;
}
