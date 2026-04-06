import Link from "next/link";
import { ProductConsoleShell } from "@/components/product-console-shell";
import { ProductEventTracker } from "@/components/product-event-tracker";
import { FormSubmitButton } from "@/components/form-submit-button";
import { MemoryCategoryFilter } from "@/components/memory-category-filter";
import { requireUser } from "@/lib/auth-redirect";
import { resolveCharacterAssetPublicUrl } from "@/lib/character-assets";
import { getSiteLanguageState } from "@/lib/i18n/site";
import { createClient } from "@/lib/supabase/server";
import { loadDashboardOverview } from "@/lib/product/dashboard";
import { resolveProductAppRoute } from "@/lib/product/route-resolution";
import { loadProductProfilePageData } from "@/lib/product/profile";
import {
  loadProductMemoryPageData,
  type ProductMemoryItem,
} from "@/lib/product/memory";
import { loadProductRoleCollection } from "@/lib/product/roles";
import { getProductModelCatalogItemBySlug } from "@/lib/product/model-catalog";
import { loadProductBillingConfiguration, resolveCurrentPlanSlug } from "@/lib/product/billing";
import { RoleVoiceTabs, type RoleVoiceGroup } from "@/components/role-voice-tabs";
import {
  restoreProductRoleDefaults,
  updateProductRoleProfile
} from "@/app/app/profile/actions";
import {
  hideProductMemory,
  markProductMemoryIncorrect,
  restoreProductMemory,
} from "@/app/app/memory/actions";

type RolePageProps = {
  searchParams: Promise<{
    feedback?: string;
    feedback_type?: string;
    role?: string;
    thread?: string;
  }>;
};

function resolveVoiceGroupKey(modelSlug: string, provider: string) {
  if (provider === "ElevenLabs") {
    return "audio-elevenlabs";
  }

  return modelSlug;
}

function resolveVoiceGroupLabel(modelSlug: string, provider: string) {
  if (provider === "ElevenLabs") {
    return "ElevenLabs";
  }

  return getProductModelCatalogItemBySlug(modelSlug)?.displayName ?? provider;
}

function resolveVoiceGroupTier(modelSlug: string, provider: string): "free" | "pro" {
  if (provider === "ElevenLabs") {
    return "pro";
  }

  return getProductModelCatalogItemBySlug(modelSlug)?.tier ?? "free";
}

function getVoiceAssetSortValue(modelSlug: string) {
  if (modelSlug === "audio-elevenlabs-multilingual-v2") {
    return 0;
  }

  if (modelSlug === "audio-elevenlabs-v3") {
    return 1;
  }

  return 2;
}

function splitMemoryGroups(items: ProductMemoryItem[]) {
  return {
    activeLongTerm: items.filter(
      (i) =>
        i.status === "active" &&
        (i.scope === "user_global" || i.scope === "user_agent"),
    ),
    activeThreadLocal: items.filter(
      (i) => i.status === "active" && i.scope === "thread_local",
    ),
    hidden: items.filter((i) => i.status === "hidden"),
    incorrect: items.filter((i) => i.status === "incorrect"),
    superseded: items.filter((i) => i.status === "superseded"),
  };
}

function RoleMemItem({
  item,
  action,
  redirectTo,
  isZh = false,
}: {
  item: ProductMemoryItem;
  action?: "hide" | "incorrect" | "restore";
  redirectTo: string;
  isZh?: boolean;
}) {
  const actionFn =
    action === "hide"
      ? hideProductMemory
      : action === "incorrect"
        ? markProductMemoryIncorrect
        : restoreProductMemory;

  const actionLabel =
    action === "hide"
      ? isZh ? "隐藏" : "Hide"
      : action === "incorrect"
        ? isZh ? "标记错误" : "Mark wrong"
        : item.status === "hidden"
          ? isZh ? "重新启用" : "Use again"
          : isZh ? "恢复" : "Restore";

  const actionPending =
    action === "hide" || action === "incorrect"
      ? isZh ? "处理中..." : "Hiding..."
      : isZh ? "恢复中..." : "Restoring...";

  return (
    <div className="role-mem-item">
      <div className="role-mem-item-body">
        <span className="role-mem-category">{item.categoryLabel}</span>
        <p className="role-mem-text">{item.content}</p>
        {item.sourceThreadId ? (
          <a
            className="role-mem-source"
            href={`/app/chat?thread=${item.sourceThreadId}`}
          >
            {item.sourceThreadTitle ?? (isZh ? "查看来源对话" : "View source thread")}
          </a>
        ) : null}
      </div>
      {action ? (
        <form action={actionFn} className="role-mem-action">
          <input name="memory_id" type="hidden" value={item.id} />
          <input name="redirect_to" type="hidden" value={redirectTo} />
          <FormSubmitButton
            className="button button-secondary role-mem-btn"
            idleText={actionLabel}
            pendingText={actionPending}
          />
        </form>
      ) : null}
    </div>
  );
}

export default async function AppRolePage({ searchParams }: RolePageProps) {
  const params = await searchParams;
  const user = await requireUser("/app/role");
  const supabase = await createClient();
  const { effectiveSystemLanguage } = await getSiteLanguageState();
  const isZh = effectiveSystemLanguage === "zh-CN";

  const roleId =
    typeof params.role === "string" && params.role.length > 0
      ? params.role
      : null;
  const threadId =
    typeof params.thread === "string" && params.thread.length > 0
      ? params.thread
      : null;

  const [overview, profileData, memoryData, resolution, roleCollection] =
    await Promise.all([
      loadDashboardOverview({ supabase, userId: user.id, roleId, threadId }),
      loadProductProfilePageData({ supabase, userId: user.id, agentId: roleId }),
      loadProductMemoryPageData({ supabase, userId: user.id, roleId, threadId }),
      resolveProductAppRoute({ supabase, userId: user.id }),
      loadProductRoleCollection({ supabase, userId: user.id }),
    ]);

  // Batch-load portrait URLs for all roles in the switcher
  const rolePortraitMap = new Map<string, string>();
  {
    const agentIds = (roleCollection?.roles ?? []).map((r) => r.agentId);
    if (agentIds.length > 0) {
      const { data: mediaProfiles } = await supabase
        .from("role_media_profiles")
        .select("agent_id, portrait_asset_id")
        .in("agent_id", agentIds)
        .eq("owner_user_id", user.id);

      const assetIds = (mediaProfiles ?? [])
        .map((p: { agent_id: string; portrait_asset_id: string | null }) => p.portrait_asset_id)
        .filter((id: string | null): id is string => typeof id === "string" && id.length > 0);

      if (assetIds.length > 0) {
        const { data: assets } = await supabase
          .from("product_portrait_assets")
          .select("id, public_url, storage_path")
          .in("id", assetIds)
          .eq("is_active", true);

        const assetUrlMap = new Map<string, string>();
        for (const asset of assets ?? []) {
          const url = resolveCharacterAssetPublicUrl({
            publicUrl: typeof asset.public_url === "string" ? asset.public_url : null,
            storagePath: typeof asset.storage_path === "string" ? asset.storage_path : null,
            supabase
          });
          if (url) assetUrlMap.set(asset.id, url);
        }

        for (const profile of mediaProfiles ?? []) {
          if (profile.portrait_asset_id && assetUrlMap.has(profile.portrait_asset_id)) {
            rolePortraitMap.set(profile.agent_id, assetUrlMap.get(profile.portrait_asset_id)!);
          }
        }
      }
    }
  }
  const [{ data: subscriptionSnapshot }, billingConfiguration] = await Promise.all([
    supabase
      .from("user_subscription_snapshots")
      .select("plan_name, plan_status")
      .eq("user_id", user.id)
      .maybeSingle(),
    loadProductBillingConfiguration({ supabase }),
  ]);

  const resolvedRoleId = roleId ?? resolution?.roleId ?? null;
  const roleQuerySuffix = resolvedRoleId
    ? `?role=${encodeURIComponent(resolvedRoleId)}`
    : "";
  const chatHref = `/app/chat${roleQuerySuffix}`;
  const redirectTo = `/app/role${roleQuerySuffix}`;
  const upgradeHref = `/app/settings${roleQuerySuffix}#settings-subscription`;
  const currentPlanSlug = resolveCurrentPlanSlug({
    subscription: {
      planName: subscriptionSnapshot?.plan_name ?? null,
      planStatus: subscriptionSnapshot?.plan_status ?? "inactive",
    },
    plans: billingConfiguration.plans,
  });

  const groups = splitMemoryGroups(memoryData?.items ?? []);
  const repairCount = groups.hidden.length + groups.incorrect.length;
  const followUpCount = overview?.followUpSummary.pendingCount ?? 0;
  const visibleRoles = roleCollection?.roles ?? [];
  const currentThreadTitle =
    profileData?.role?.currentThreadTitle ??
    overview?.currentThread?.title ??
    null;

  const activeRolePortraitUrl =
    profileData?.role?.media?.portraitAssetUrl ??
    (resolvedRoleId ? rolePortraitMap.get(resolvedRoleId) ?? null : null);

  return (
    <ProductConsoleShell
      actions={
        <Link className="button button-primary" href={chatHref}>
          {isZh ? "返回聊天" : "Back to chat"}
        </Link>
      }
      currentHref="/app/role"
      description={
        isZh
          ? "定义这位伴侣，并查看这段关系记住了什么。"
          : "Define this companion and review what the relationship remembers."
      }
      eyebrow={isZh ? "角色" : "Role"}
      rolePortraitUrl={activeRolePortraitUrl}
      shellContext={overview}
      title={profileData?.role?.name ?? (isZh ? "角色" : "Role")}
    >
      <ProductEventTracker
        event="role_assets_view"
        payload={{ surface: "dashboard_role" }}
      />

      {params.feedback ? (
        <div
          className={`notice ${
            params.feedback_type === "error" ? "notice-error" : "notice-success"
          }`}
        >
          {params.feedback}
        </div>
      ) : null}

      {/* ── 0. Role switcher ── */}
      {visibleRoles.length > 0 ? (
        <section className="role-switcher-section">
          <div className="role-switcher-section-head">
            <span className="role-switcher-section-label">{isZh ? "我的角色" : "My roles"}</span>
          </div>
          <div className="role-switcher-cards">
            {visibleRoles.map((role) => {
              const isActive = role.agentId === resolvedRoleId;
              const portraitUrl = rolePortraitMap.get(role.agentId) ?? null;
              return (
                <Link
                  key={role.agentId}
                  className={`role-switcher-card${isActive ? " active" : ""}`}
                  href={`/app/role?role=${encodeURIComponent(role.agentId)}`}
                >
                  <div className="role-switcher-card-portrait" aria-hidden="true">
                    {portraitUrl ? (
                      <img
                        src={portraitUrl}
                        alt={role.name}
                        className="role-switcher-card-portrait-img"
                      />
                    ) : (
                      <span className="role-switcher-card-portrait-initial">
                        {role.name.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    {isActive ? (
                      <span className="role-switcher-card-status-dot live" />
                    ) : null}
                  </div>
                  {isActive ? (
                    <span className="role-switcher-card-badge">{isZh ? "当前使用" : "Active"}</span>
                  ) : null}
                  <span className="role-switcher-card-name">{role.name}</span>
                  <span className="role-switcher-card-last">
                    {role.lastInteractionAt
                      ? new Date(role.lastInteractionAt).toLocaleDateString()
                      : isZh ? "暂无活动" : "No activity"}
                  </span>
                </Link>
              );
            })}
            <Link className="role-switcher-card role-switcher-card-new" href="/app/create">
              <div className="role-switcher-card-portrait role-switcher-card-portrait-new" aria-hidden="true">
                <span className="role-switcher-card-portrait-plus">+</span>
              </div>
              <span className="role-switcher-card-name">{isZh ? "新角色" : "New role"}</span>
              <span className="role-switcher-card-last">{isZh ? "创建" : "Create"}</span>
            </Link>
          </div>
        </section>
      ) : null}

      {/* ── Relationship state bar ── */}
      <div className="role-state-bar">
        <div className="role-state-item">
          <span className="role-state-label">{isZh ? "对话线程" : "Thread"}</span>
          <span className="role-state-value">
            {currentThreadTitle ?? (isZh ? "还没有对话" : "No thread yet")}
          </span>
        </div>
        <div className="role-state-divider" />
        <div className="role-state-item">
          <span
            className={`role-state-badge${repairCount > 0 ? " attention" : ""}`}
          >
            {repairCount > 0
              ? isZh
                ? `${repairCount} 条记忆需要处理`
                : `${repairCount} memory item${repairCount > 1 ? "s" : ""} need attention`
              : isZh ? "记忆状态稳定" : "Memory stable"}
          </span>
        </div>
        {followUpCount > 0 ? (
          <>
            <div className="role-state-divider" />
            <div className="role-state-item">
              <span className="role-state-badge attention">
                {isZh
                  ? `${followUpCount} 条后续跟进待处理`
                  : `${followUpCount} follow-up${followUpCount > 1 ? "s" : ""} pending`}
              </span>
            </div>
          </>
        ) : null}
      </div>

      {/* ── 1. Profile ── */}
      <section className="site-card role-profile-card">
        <div className="role-section-head">
          <h2 className="role-section-title">{isZh ? "角色资料" : "Companion"}</h2>
        </div>

        {profileData?.role ? (
          <form
            action={updateProductRoleProfile}
            className="role-profile-form"
          >
            <input name="agent_id" type="hidden" value={profileData.role.agentId} />
            <input name="redirect_to" type="hidden" value={redirectTo} />
            {/* Preserve portrait binding — portrait is set at creation and not editable here */}
            <input
              name="portrait_asset_id"
              type="hidden"
              value={profileData.role.media.portraitAssetId ?? ""}
            />
            <input
              name="portrait_reference_enabled_by_default"
              type="hidden"
              value="true"
            />

            {/* ── Profile ── */}
            <div className="role-subsection">
              <div className="role-subsection-head">
                <h3 className="role-subsection-title">{isZh ? "基础资料" : "Profile"}</h3>
              </div>

              {profileData.role.sourcePersonaPackName ? (
                <div className="role-preset-banner">
                  <div className="role-preset-banner-copy">
                    <span className="role-state-badge">
                      {isZh
                        ? `基于预设 ${profileData.role.sourcePersonaPackName}`
                        : `Based on ${profileData.role.sourcePersonaPackName}`}
                    </span>
                    <p className="role-field-hint">
                      {isZh
                        ? "这个角色最初来自系统预设。你可以继续编辑，也可以恢复预设里的语气、背景、头像和语音。"
                        : "This role started from a system preset. You can keep editing it, or restore the preset defaults for tone, background, portrait, and voice."}
                    </p>
                  </div>
                  <button
                    className="button button-secondary"
                    formAction={restoreProductRoleDefaults}
                    type="submit"
                  >
                    {isZh ? "恢复默认" : "Restore defaults"}
                  </button>
                </div>
              ) : null}

              {profileData.role.media.portraitAssetUrl ? (
                <div className="role-portrait-panel">
                  <div className="role-portrait-panel-copy">
                    <label className="label">{isZh ? "头像" : "Portrait"}</label>
                    <p className="role-field-hint">
                      {isZh ? "为了保持角色连续性，创建后头像会锁定。" : "Portrait is locked after creation to preserve continuity."}
                    </p>
                  </div>
                  <img
                    alt={profileData.role.name}
                    className="rcw-portrait role-portrait-panel-image"
                    src={profileData.role.media.portraitAssetUrl}
                  />
                </div>
              ) : null}

              <div className="role-form-grid-3">
                <div className="field">
                  <label className="label" htmlFor="rp-name">{isZh ? "名称" : "Name"}</label>
                  <input
                    className="input"
                    defaultValue={profileData.role.name}
                    id="rp-name"
                    name="name"
                  />
                </div>
                <div className="field">
                  <label className="label" htmlFor="rp-mode">{isZh ? "模式" : "Mode"}</label>
                  <select
                    className="input"
                    defaultValue={profileData.role.config.mode}
                    id="rp-mode"
                    name="mode"
                  >
                    <option value="companion">{isZh ? "伴侣型" : "Companion"}</option>
                    <option value="assistant">{isZh ? "助手型" : "Assistant"}</option>
                  </select>
                </div>
                <div className="field">
                  <label className="label" htmlFor="rp-tone">{isZh ? "语气" : "Tone"}</label>
                  <select
                    className="input"
                    defaultValue={profileData.role.config.tone}
                    id="rp-tone"
                    name="tone"
                  >
                    <option value="warm">{isZh ? "温柔" : "Warm"}</option>
                    <option value="playful">{isZh ? "活泼" : "Playful"}</option>
                    <option value="steady">{isZh ? "沉稳" : "Steady"}</option>
                  </select>
                </div>
              </div>

              <div className="role-form-grid-2">
                <div className="field">
                  <label className="label" htmlFor="rp-rel-mode">{isZh ? "关系模式" : "Relationship mode"}</label>
                  <input
                    className="input"
                    defaultValue={profileData.role.config.relationshipMode}
                    id="rp-rel-mode"
                    name="relationship_mode"
                  />
                </div>
                <div className="field">
                  <label className="label" htmlFor="rp-proactivity">{isZh ? "主动程度" : "Proactivity"}</label>
                  <select
                    className="input"
                    defaultValue={profileData.role.config.proactivityLevel}
                    id="rp-proactivity"
                    name="proactivity_level"
                  >
                    <option value="low">{isZh ? "低" : "Low"}</option>
                    <option value="balanced">{isZh ? "平衡" : "Balanced"}</option>
                    <option value="active">{isZh ? "高" : "Active"}</option>
                  </select>
                </div>
              </div>

              <div className="field">
                <label className="label" htmlFor="rp-boundaries">{isZh ? "边界" : "Boundaries"}</label>
                <textarea
                  className="input textarea"
                  defaultValue={profileData.role.config.boundaries}
                  id="rp-boundaries"
                  name="boundaries"
                  rows={3}
                />
              </div>

              <div className="field">
                <label className="label" htmlFor="rp-background">{isZh ? "背景设定" : "Background"}</label>
                <textarea
                  className="input textarea"
                  defaultValue={profileData.role.backgroundSummary ?? ""}
                  id="rp-background"
                  name="background_summary"
                  rows={3}
                />
              </div>

              {profileData.role.personaSummary ? (
                <p className="role-persona-preview">{profileData.role.personaSummary}</p>
              ) : null}
            </div>

            {/* ── Voice ── */}
            {(() => {
              const rawAssets = profileData.role.mediaLibraries.audioAssets;
              const voiceGroups: RoleVoiceGroup[] = [];
              for (const asset of rawAssets) {
                const groupKey = resolveVoiceGroupKey(asset.modelSlug, asset.provider);
                const existing = voiceGroups.find((g) => g.modelSlug === groupKey);
                if (existing) {
                  existing.assets.push(asset);
                } else {
                  voiceGroups.push({
                    modelSlug: groupKey,
                    modelDisplayName: resolveVoiceGroupLabel(asset.modelSlug, asset.provider),
                    tier: resolveVoiceGroupTier(asset.modelSlug, asset.provider),
                    assets: [asset],
                  });
                }
              }

              for (const group of voiceGroups) {
                group.assets.sort((left, right) => {
                  const byModel = getVoiceAssetSortValue(left.modelSlug) - getVoiceAssetSortValue(right.modelSlug);
                  if (byModel !== 0) {
                    return byModel;
                  }

                  if (left.isDefault !== right.isDefault) {
                    return Number(right.isDefault) - Number(left.isDefault);
                  }

                  return left.displayName.localeCompare(right.displayName);
                });
              }

              // Free-tier groups first, then pro
              voiceGroups.sort((a, b) => {
                if (a.tier === b.tier) return 0;
                return a.tier === "free" ? -1 : 1;
              });

              return (
                <div className="role-subsection">
                  <div className="role-subsection-head">
                    <h3 className="role-subsection-title">{isZh ? "语音" : "Voice"}</h3>
                  </div>
                  <p className="role-field-hint">
                    {isZh
                      ? "为这位伴侣选择语音。语音属于角色级设置，会在不同对话里保持一致。"
                      : "Choose the voice for this companion. Voice is role-specific and stays with this companion across conversations."}
                  </p>

                  {rawAssets.length > 0 ? (
                    <RoleVoiceTabs
                      currentPlanSlug={currentPlanSlug === "pro" ? "pro" : "free"}
                      groups={voiceGroups}
                      language={effectiveSystemLanguage}
                      selectedAssetId={profileData.role.media.audioAssetId}
                      upgradeHref={upgradeHref}
                    />
                  ) : (
                    <p className="role-field-hint">{isZh ? "语音库加载中…" : "Voice library is loading…"}</p>
                  )}
                </div>
              );
            })()}

            <div className="role-form-footer">
              <FormSubmitButton idleText={isZh ? "保存" : "Save"} pendingText={isZh ? "保存中..." : "Saving..."} />
            </div>
          </form>
        ) : (
          <div className="product-empty-state">
            <strong>{isZh ? "还没有角色" : "No companion yet"}</strong>
            <p>
              {isZh
                ? "先创建一位伴侣，再回来继续调整长期行为和记忆。"
                : "Create a companion first, then come back here to shape long-term behavior and memory."}
            </p>
          </div>
        )}
      </section>

      {/* ── 2. Memory ── */}
      <section className="role-memory-section">
        <div className="role-section-head">
          <h2 className="role-section-title">{isZh ? "记忆" : "Memory"}</h2>
          <div className="role-memory-stats">
            <span
              className={repairCount > 0 ? "role-memory-stat-warn" : undefined}
            >
              {isZh ? `${repairCount} 条待处理` : `${repairCount} to review`}
            </span>
            <span className="role-memory-stats-dot">·</span>
            <span>{isZh ? `${groups.activeLongTerm.length} 条已保存` : `${groups.activeLongTerm.length} saved`}</span>
            <span className="role-memory-stats-dot">·</span>
            <span>{isZh ? `${groups.activeThreadLocal.length} 条近期` : `${groups.activeThreadLocal.length} recent`}</span>
          </div>
        </div>

        {/* Needs attention */}
        {repairCount > 0 ? (
          <div className="site-card role-attention-card">
            <p className="role-attention-label">{isZh ? "需要处理" : "Needs attention"}</p>
            <div className="role-mem-list">
              {[...groups.incorrect, ...groups.hidden].map((item) => (
                <RoleMemItem
                  key={item.id}
                  action="restore"
                  isZh={isZh}
                  item={item}
                  redirectTo={redirectTo}
                />
              ))}
            </div>
          </div>
        ) : null}

        {/* Categorized memory with filter tabs */}
        <div className="site-card role-mem-filter-card">
          <MemoryCategoryFilter
            language={effectiveSystemLanguage}
            redirectTo={redirectTo}
            items={[...groups.activeLongTerm, ...groups.activeThreadLocal].map((i) => ({
              id: i.id,
              categoryLabel: i.categoryLabel,
              content: i.content,
              status: i.status,
              scope: i.scope ?? "",
              createdAt: i.created_at,
              sourceThreadTitle: i.sourceThreadTitle,
              sourceThreadId: i.sourceThreadId,
            }))}
          />
        </div>

        {/* Older items — collapsed */}
        {groups.superseded.length > 0 ? (
          <details className="site-card role-mem-older">
            <summary className="role-mem-older-summary">
              {isZh ? `更早的记忆（${groups.superseded.length}）` : `Older items (${groups.superseded.length})`}
            </summary>
            <div className="role-mem-list role-mem-list-older">
              {groups.superseded.map((item) => (
                <RoleMemItem
                  key={item.id}
                  isZh={isZh}
                  item={item}
                  redirectTo={redirectTo}
                />
              ))}
            </div>
          </details>
        ) : null}
      </section>

    </ProductConsoleShell>
  );
}
