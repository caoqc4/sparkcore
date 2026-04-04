import Link from "next/link";
import { BillingCadenceSelector } from "@/components/billing-cadence-selector";
import { ProductConsoleShell } from "@/components/product-console-shell";
import { requireUser } from "@/lib/auth-redirect";
import { getSiteLanguageState } from "@/lib/i18n/site";
import { loadDashboardOverview } from "@/lib/product/dashboard";
import { resolveProductAppRoute } from "@/lib/product/route-resolution";
import { loadProductSettingsPageData } from "@/lib/product/settings";
import { createClient } from "@/lib/supabase/server";

const PRO_CADENCE_OPTIONS = [
  {
    key: "monthly",
    label: "Monthly",
    price: "$14.99",
    period: "/ mo",
    perMonthNote: null,
    savingsNote: null,
  },
  {
    key: "quarterly",
    label: "Quarterly",
    price: "$39.99",
    period: "/ qtr",
    perMonthNote: "~$13.33 / mo",
    savingsNote: "Save 11%",
  },
  {
    key: "yearly",
    label: "Yearly",
    price: "$99.99",
    period: "/ yr",
    perMonthNote: "~$8.33 / mo",
    savingsNote: "Save 44%",
  },
] as const;

export default async function AppSubscriptionPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser("/app/subscription");
  const supabase = await createClient();
  const { effectiveSystemLanguage } = await getSiteLanguageState();
  const isZh = effectiveSystemLanguage === "zh-CN";
  const searchParams = (await props.searchParams) ?? {};
  const [resolution, overview, settingsData, wallet] = await Promise.all([
    resolveProductAppRoute({ supabase, userId: user.id }),
    loadDashboardOverview({ supabase, userId: user.id, roleId: null, threadId: null }),
    loadProductSettingsPageData({ supabase, user }),
    supabase
      .from("user_credit_wallets")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);
  const feedback =
    typeof searchParams.feedback === "string" ? searchParams.feedback : null;
  const feedbackType =
    typeof searchParams.feedback_type === "string" ? searchParams.feedback_type : null;

  const roleQuerySuffix = resolution?.roleId
    ? `?role=${encodeURIComponent(resolution.roleId)}`
    : "";
  const upgradeHref = settingsData.subscriptionSummary.upgradeHref;
  const checkoutHref =
    upgradeHref !== "/app/subscription" && !upgradeHref.endsWith("/app/subscription")
      ? upgradeHref
      : null;

  const isPro = settingsData.subscriptionSummary.currentPlanSlug === "pro";
  const creditBalance: number = wallet.data?.balance ?? 0;
  const currentBillingInterval = settingsData.subscriptionSummary.currentBillingInterval;
  const shouldHideCheckoutFeedback =
    isPro &&
    feedbackType !== "error" &&
    typeof feedback === "string" &&
    feedback.toLowerCase().includes("checkout started");
  const renewalLabel = settingsData.subscriptionSummary.renewalDateLabel
    ? new Date(settingsData.subscriptionSummary.renewalDateLabel).toLocaleDateString()
    : "—";

  return (
    <ProductConsoleShell
      actions={
        <Link className="button button-secondary" href={`/app/settings${roleQuerySuffix}`}>
          {isZh ? "返回设置" : "Back to settings"}
        </Link>
      }
      currentHref="/app/subscription"
      description={isPro ? (isZh ? "管理你的订阅、计费周期和积分。" : "Manage your subscription, billing period, and credits.") : isZh ? "比较方案、查看积分并管理账单。" : "Compare plans, review credits, and manage your billing."}
      eyebrow={isZh ? "订阅" : "Subscription"}
      shellContext={overview}
      title={isZh ? "方案与账单" : "Plans & billing"}
    >
      {feedback && !shouldHideCheckoutFeedback ? (
        <div className={`notice ${feedbackType === "error" ? "notice-warning" : "notice-success"}`}>
          {feedback}
        </div>
      ) : null}

      {/* ── Pro: current subscription status ── */}
      {isPro && (
        <section className="site-card settings-card">
          <div className="sub-pro-status">
            <div className="sub-pro-status-left">
              <span className="settings-plan-badge tier-pro">Pro</span>
              {renewalLabel !== "—" && (
                <span className="settings-sub-renewal">{isZh ? `续费于 ${renewalLabel}` : `Renews ${renewalLabel}`}</span>
              )}
              <p className="sub-pro-status-desc">
                {isZh ? "高级模型和完整的月度额度已启用。" : "Premium models and full monthly allowances are active."}
              </p>
            </div>
            {checkoutHref && (
              <div className="sub-pro-status-actions">
                <Link className="button button-secondary" href={checkoutHref}>
                  {isZh ? "管理账单" : "Manage billing"}
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Pro: switch billing period ── */}
      {isPro && (
        <section className="site-card settings-card">
          <div className="role-section-head">
            <h2 className="role-section-title">{isZh ? "计费周期" : "Billing period"}</h2>
          </div>
          <p className="role-section-desc" style={{ marginBottom: 16, marginTop: -8 }}>
            {isZh ? "切换到更长周期可以降低你的实际月均成本。" : "Switching to a longer period reduces your effective monthly cost."}
            {checkoutHref && (
              <>
                {" "}
                <Link href={checkoutHref} style={{ textDecoration: "underline" }}>
                  {isZh ? "在账单门户中修改" : "Change in billing portal"}
                </Link>
              </>
            )}
          </p>
          <div className="sub-cadence-display">
            {PRO_CADENCE_OPTIONS.map((c) => (
              <div
                key={c.key}
                className={`sub-cadence-item${c.key === currentBillingInterval ? " sub-cadence-item-current" : ""}`}
              >
                {c.key === currentBillingInterval ? (
                  <span className="cadence-current-badge">{isZh ? "当前" : "Current"}</span>
                ) : c.savingsNote ? (
                  <span className="cadence-savings-badge">{isZh && c.savingsNote === "Save 11%" ? "省 11%" : isZh && c.savingsNote === "Save 44%" ? "省 44%" : c.savingsNote}</span>
                ) : null}
                <span className="sub-cadence-label">{isZh ? c.key === "monthly" ? "月付" : c.key === "quarterly" ? "季付" : "年付" : c.label}</span>
                <div className="cadence-option-pricing">
                  <span className="cadence-option-price">{c.price}</span>
                  <span className="cadence-option-period">{c.period}</span>
                </div>
                {c.perMonthNote && (
                  <span className="cadence-option-per-month">{c.perMonthNote}</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Free: plan comparison + upgrade ── */}
      {!isPro && (
        <section className="site-card settings-card">
          <div className="role-section-head">
            <h2 className="role-section-title">{isZh ? "选择你的方案" : "Choose your plan"}</h2>
          </div>
          <p className="role-section-desc" style={{ marginBottom: 16, marginTop: -8 }}>
            {isZh ? "你的方案决定了可用模型池和每月额度。" : "Your plan defines which model pools are available and your monthly allowances."}
          </p>

          <div className="sub-plan-compare">
            {/* Free column */}
            <div className="sub-plan-col current">
              <div className="sub-plan-col-head">
                <div className="sub-plan-col-title-row">
                  <span className="sub-plan-col-name">{isZh ? "免费版" : "Free"}</span>
                  <span className="sub-plan-current-badge">{isZh ? "当前方案" : "Your plan"}</span>
                </div>
                <span className="sub-plan-price">$0</span>
              </div>
              <ul className="sub-plan-feature-list">
                <li className="sub-plan-feature">
                  <span className="sub-plan-feature-check included">✓</span>
                  <span>{isZh ? "标准文本模型" : "Standard text models"}</span>
                </li>
                <li className="sub-plan-feature">
                  <span className="sub-plan-feature-check included">✓</span>
                  <span>{isZh ? "标准图像模型" : "Standard image models"}</span>
                </li>
                <li className="sub-plan-feature">
                  <span className="sub-plan-feature-check included">✓</span>
                  <span>{isZh ? "每月 10 次图像生成" : "10 image generations / month"}</span>
                </li>
                <li className="sub-plan-feature">
                  <span className="sub-plan-feature-check included">✓</span>
                  <span>{isZh ? "每月 15 分钟语音" : "15 audio minutes / month"}</span>
                </li>
              </ul>
            </div>

            {/* Pro column */}
            <div className="sub-plan-col featured">
              <div className="sub-plan-col-head">
                <div className="sub-plan-col-title-row">
                  <span className="sub-plan-col-name">Pro</span>
                  <span className="sub-plan-recommended-badge">{isZh ? "推荐" : "Recommended"}</span>
                </div>
                <span className="sub-plan-price">from $14.99<span className="sub-plan-price-period"> / mo</span></span>
              </div>
              <ul className="sub-plan-feature-list">
                <li className="sub-plan-feature">
                  <span className="sub-plan-feature-check included">✓</span>
                  <span>{isZh ? "高级文本模型" : "Premium text models"}</span>
                </li>
                <li className="sub-plan-feature">
                  <span className="sub-plan-feature-check included">✓</span>
                  <span>{isZh ? "高级图像模型" : "Premium image models"}</span>
                </li>
                <li className="sub-plan-feature">
                  <span className="sub-plan-feature-check included">✓</span>
                  <span>{isZh ? "每月 80 次图像生成" : "80 image generations / month"}</span>
                </li>
                <li className="sub-plan-feature">
                  <span className="sub-plan-feature-check included">✓</span>
                  <span>{isZh ? "每月 120 分钟语音" : "120 audio minutes / month"}</span>
                </li>
                <li className="sub-plan-feature">
                  <span className="sub-plan-feature-check included">✓</span>
                  <span>{isZh ? "可用积分扩展额度" : "Credits for extended usage"}</span>
                </li>
              </ul>
              <div className="sub-plan-upgrade-area">
                <BillingCadenceSelector checkoutHref={checkoutHref} language={effectiveSystemLanguage} />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Credits ── */}
      <section className="site-card settings-card">
        <div className="role-section-head">
          <h2 className="role-section-title">{isZh ? "积分" : "Credits"}</h2>
        </div>
        <p className="role-section-desc" style={{ marginBottom: 16, marginTop: -8 }}>
          {isPro
            ? isZh ? "当你的月度额度用完后，积分可以继续扩展图像和语音使用量。" : "Credits extend image and audio usage after your monthly allowances are used."
            : creditBalance > 0
              ? isZh ? `你还有 ${creditBalance} 点积分可用。现有积分可以扩展免费档的图像和语音使用，但购买更多积分需要 Pro。` : `You still have ${creditBalance} credits available. Existing credits can extend free-tier image and audio usage, but buying more credits requires Pro.`
              : isZh ? "月度额度用完后，积分可继续扩展图像和语音使用。仅对 Pro 用户开放。" : "Credits extend image and audio usage after monthly allowances are used. Available to Pro members."}
        </p>
        <div className="sub-credits-row">
          <div className="sub-credits-facts">
            <div className="sub-credits-fact">
              <span className="settings-meta-label">{isZh ? "图像超额" : "Image overage"}</span>
              <span className="settings-meta-value">2–4 credits / image</span>
            </div>
            <div className="sub-credits-fact">
              <span className="settings-meta-label">{isZh ? "语音超额" : "Audio overage"}</span>
              <span className="settings-meta-value">3–5 credits / minute</span>
            </div>
          </div>
          <Link
            className="button button-secondary"
            href={`/app/credits${roleQuerySuffix}`}
          >
            {isZh ? "查看积分与套餐" : "View credits & packs"}
          </Link>
        </div>
      </section>
    </ProductConsoleShell>
  );
}
