import Link from "next/link";
import { ChatConsoleShell } from "@/components/chat-console-shell";
import { ProductConsoleShell } from "@/components/product-console-shell";
import { ProductEventTracker } from "@/components/product-event-tracker";
import { SupplementaryChatThread } from "@/components/supplementary-chat-thread";
import { requireUser } from "@/lib/auth-redirect";
import { getSiteLanguageState } from "@/lib/i18n/site";
import { loadDashboardOverview } from "@/lib/product/dashboard";
import { loadCurrentProductPlanSlug } from "@/lib/product/billing";
import { resolveProductAppRoute } from "@/lib/product/route-resolution";
import {
  loadOwnedRoleMediaProfile,
  resolveConsumableAudioAsset
} from "@/lib/product/role-media";
import { createClient } from "@/lib/supabase/server";
import { loadProductSupplementaryChatPageData } from "@/lib/product/supplementary-chat";

type DashboardChatPageProps = {
  searchParams: Promise<{
    thread?: string;
    role?: string;
  }>;
};

export default async function AppChatPage({
  searchParams,
}: DashboardChatPageProps) {
  const params = await searchParams;
  const user = await requireUser("/app/chat");
  const supabase = await createClient();
  const { effectiveSystemLanguage } = await getSiteLanguageState();
  const isZh = effectiveSystemLanguage === "zh-CN";
  const roleId =
    typeof params.role === "string" && params.role.length > 0
      ? params.role
      : null;
  const [data, overview, resolution] = await Promise.all([
    loadProductSupplementaryChatPageData({
      supabase,
      userId: user.id,
      threadId: typeof params.thread === "string" ? params.thread : null,
      roleId,
    }),
    loadDashboardOverview({
      supabase,
      userId: user.id,
      threadId: typeof params.thread === "string" ? params.thread : null,
      roleId,
    }),
    resolveProductAppRoute({
      supabase,
      userId: user.id,
    }),
  ]);

  const resolvedRoleId = roleId ?? resolution?.roleId ?? null;
  const roleQuerySuffix = resolvedRoleId
    ? `?role=${encodeURIComponent(resolvedRoleId)}`
    : "";
  const roleHref = `/app/role${roleQuerySuffix}`;
  const channelsHref = `/app/channels${roleQuerySuffix}`;

  if (!data) {
    return null;
  }

  // Empty state — no role or thread yet
  if (!data.thread || !data.role) {
    return (
        <ProductConsoleShell
          actions={
            <Link className="button site-action-link" href="/create">
            {isZh ? "创建伴侣" : "Create companion"}
          </Link>
        }
        currentHref="/app/chat"
        description={
          isZh
            ? "先创建一位伴侣，再回到这里继续这段关系。"
            : "Create a companion first, then come back here to continue the relationship."
        }
        eyebrow={isZh ? "聊天" : "Chat"}
        shellContext={overview}
        title={isZh ? "还没有对话。" : "No conversation yet."}
      >
        <div className="product-empty-state">
          <strong>{isZh ? "还没有设置伴侣" : "No companion set up"}</strong>
          <p>
            {isZh
              ? "先创建一个角色，你的第一段对话就会出现在这里。"
              : "Start by creating a role, then your first conversation will appear here."}
          </p>
        </div>
      </ProductConsoleShell>
    );
  }

  const followUpCount = overview?.followUpSummary.pendingCount ?? 0;
  const { data: roleMediaProfile } = await loadOwnedRoleMediaProfile({
    supabase,
    agentId: data.role.agentId,
    workspaceId: data.workspaceId,
    userId: user.id
  });
  const currentAudioAssetId =
    typeof roleMediaProfile?.audio_asset_id === "string" &&
    roleMediaProfile.audio_asset_id.length > 0
      ? roleMediaProfile.audio_asset_id
      : typeof roleMediaProfile?.audio_voice_option_id === "string" &&
          roleMediaProfile.audio_voice_option_id.length > 0
        ? roleMediaProfile.audio_voice_option_id
        : null;
  const currentPlanSlug = await loadCurrentProductPlanSlug({
    supabase,
    userId: user.id
  });
  const { data: currentAudioAsset } = await resolveConsumableAudioAsset({
    supabase,
    currentPlanSlug,
    requestedAudioAssetId: currentAudioAssetId
  });
  const audioPlayback = {
    enabled:
      currentAudioAsset?.provider === "Azure" ||
      currentAudioAsset?.provider === "ElevenLabs",
    provider: typeof currentAudioAsset?.provider === "string" ? currentAudioAsset.provider : null,
    voiceName:
      typeof currentAudioAsset?.display_name === "string"
        ? currentAudioAsset.display_name
        : null
  };

  return (
    <ChatConsoleShell
      currentHref="/app/chat"
      roleHref={roleHref}
      channelsHref={channelsHref}
      threadTitle={data.thread.title}
      followUpCount={followUpCount}
      shellContext={overview}
    >
      <ProductEventTracker
        event="first_supplementary_chat_view"
        payload={{
          surface: "dashboard_chat",
          platform: data.bindings.platforms[0] ?? "web_only",
        }}
      />
      <SupplementaryChatThread
        audioPlayback={audioPlayback}
        language={effectiveSystemLanguage}
        messages={data.messages}
        threadId={data.thread.threadId}
        roleName={data.role.name}
        showGovernanceDebug={process.env.CHAT_GOVERNANCE_DEBUG === "1"}
      />
    </ChatConsoleShell>
  );
}
