import Link from "next/link";
import { CheckoutFeedbackRefresh } from "@/components/checkout-feedback-refresh";
import { CreemCheckoutButton } from "@/components/creem-checkout-button";
import { ProductConsoleShell } from "@/components/product-console-shell";
import { requireUser } from "@/lib/auth-redirect";
import { getSiteLanguageState } from "@/lib/i18n/site";
import { loadDashboardOverview } from "@/lib/product/dashboard";
import { resolveProductAppRoute } from "@/lib/product/route-resolution";
import { loadProductSettingsPageData } from "@/lib/product/settings";
import { createClient } from "@/lib/supabase/server";

const CREDIT_PACKAGES = [
  {
    key: "credits_100",
    label: "100 credits",
    buyLabel: "Buy 100 credits",
    price: "$4.99",
    perCredit: "$0.05 each",
    hint: "Great for occasional extra images or audio.",
  },
  {
    key: "credits_250",
    label: "250 credits",
    buyLabel: "Buy 250 credits",
    price: "$9.99",
    perCredit: "$0.04 each",
    hint: "Best balance of value and flexibility.",
  },
  {
    key: "credits_700",
    label: "700 credits",
    buyLabel: "Buy 700 credits",
    price: "$24.99",
    perCredit: "~$0.036 each",
    hint: "Best value for heavy image or audio use.",
  },
] as const;

export default async function AppCreditsPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser("/app/credits");
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
  const creditBalance: number = wallet.data?.balance ?? 0;
  const feedback =
    typeof searchParams.feedback === "string" ? searchParams.feedback : null;
  const feedbackType =
    typeof searchParams.feedback_type === "string" ? searchParams.feedback_type : null;
  const shouldHideCheckoutFeedback =
    creditBalance > 0 &&
    feedbackType !== "error" &&
    typeof feedback === "string" &&
    feedback.toLowerCase().includes("checkout started");
  const shouldRefreshForCheckoutFeedback =
    feedbackType !== "error" &&
    typeof feedback === "string" &&
    feedback.toLowerCase().includes("checkout started");

  const roleQuerySuffix = resolution?.roleId
    ? `?role=${encodeURIComponent(resolution.roleId)}`
    : "";
  const isPro = settingsData.subscriptionSummary.currentPlanSlug === "pro";
  const hasCredits = creditBalance > 0;

  return (
    <ProductConsoleShell
      actions={
        <Link className="button button-secondary" href={`/app/subscription${roleQuerySuffix}`}>
          {isZh ? "返回订阅" : "Back to subscription"}
        </Link>
      }
      currentHref="/app/credits"
      description={isZh ? "查看积分包、了解使用成本，并在需要时补充积分。" : "Review credit packs, understand usage cost, and top up when you need more."}
      eyebrow={isZh ? "积分" : "Credits"}
      shellContext={overview}
      title={isZh ? "积分" : "Credits"}
    >
      <CheckoutFeedbackRefresh enabled={shouldRefreshForCheckoutFeedback} />

      {feedback && !shouldHideCheckoutFeedback ? (
        <div className={`notice ${feedbackType === "error" ? "notice-warning" : "notice-success"}`}>
          {feedback}
        </div>
      ) : null}

      {/* ── Balance (Pro only) ── */}
      {(isPro || hasCredits) && (
        <section className="site-card settings-card">
          <div className="credits-balance-row">
            <div className="credits-balance-main">
              <span className="settings-meta-label">{isZh ? "当前余额" : "Current balance"}</span>
              <span className="credits-balance-amount">{creditBalance}</span>
              <span className="credits-balance-unit">{isZh ? "积分" : "credits"}</span>
            </div>
            <p className="credits-balance-note">
              {isPro
                ? isZh ? "当你的月度图像或语音额度用完后，积分会自动启用，而且永不过期。" : "Credits are used automatically when your monthly image or audio allowance runs out. They never expire."
                : isZh ? "你现有的积分仍可使用，可继续扩展免费档的图像和语音用量。购买新积分需要启用 Pro 方案。" : "Your existing credits are still available and can extend free-plan image and audio usage. New credit purchases require an active Pro plan."}
            </p>
          </div>
        </section>
      )}

      {/* ── How credits work (Free only — explains the system to encourage upgrade) ── */}
      {!isPro && (
        <section className="site-card settings-card">
          <div className="role-section-head">
            <h2 className="role-section-title">{isZh ? "积分如何生效" : "How credits work"}</h2>
          </div>
          <div className="credits-explainer-grid">
            <div className="credits-explainer-item">
              <span className="credits-explainer-step">1</span>
              <div>
                <p className="credits-explainer-heading">{isZh ? "先消耗方案内额度" : "Plan allowances come first"}</p>
                <p className="credits-explainer-body">
                  {isZh ? "Pro 每月包含 80 次图像生成和 120 分钟语音，无需额外付费。" : "Pro includes 80 monthly image generations and 120 audio minutes at no extra cost."}
                </p>
              </div>
            </div>
            <div className="credits-explainer-item">
              <span className="credits-explainer-step">2</span>
              <div>
                <p className="credits-explainer-heading">{isZh ? "额度用完后由积分接续" : "Credits extend when allowance runs out"}</p>
                <p className="credits-explainer-body">
                  {isZh ? "当月度额度耗尽后，积分会自动覆盖额外的图像和语音使用。" : "Once your monthly allowance is exhausted, credits automatically cover additional image and audio usage."}
                </p>
              </div>
            </div>
            <div className="credits-explainer-item">
              <span className="credits-explainer-step">3</span>
              <div>
                <p className="credits-explainer-heading">{isZh ? "按需补充即可" : "Pay only what you need"}</p>
                <p className="credits-explainer-body">
                  {isZh ? "积分永不过期，会按月结转。买一次，在需要时使用即可。" : "Credits never expire and roll over month to month. Buy a pack once and use it when needed."}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Upgrade gate for free users ── */}
      {!isPro && (
        <div className="credits-pro-gate">
          <div className="credits-pro-gate-copy">
            <span className="credits-pro-gate-icon">🔒</span>
            <div>
              <p className="credits-pro-gate-title">
                {hasCredits ? (isZh ? "购买新积分需要启用 Pro 方案" : "New credit purchases require an active Pro plan") : isZh ? "积分功能需要启用 Pro 方案" : "Credits require an active Pro plan"}
              </p>
              <p className="credits-pro-gate-desc">
                {hasCredits
                  ? isZh ? "你剩余的积分仍然可以用于免费档的图像和语音生成，但购买更多积分需要 Pro。" : "Your remaining credits are still usable on free-tier image and audio generation, but buying more credits requires Pro."
                  : isZh ? "升级到 Pro 后可以购买积分，并把图像和语音使用量扩展到月度额度之外。" : "Upgrade to Pro to unlock credit purchases and extend your image and audio usage beyond monthly allowances."}
              </p>
            </div>
          </div>
          <Link
            className="button button-primary"
            href={`/app/subscription${roleQuerySuffix}`}
          >
            {isZh ? "查看 Pro 方案" : "View Pro plans"}
          </Link>
        </div>
      )}

      {/* ── Credit packs ── */}
      <section className="site-card settings-card">
        <div className="role-section-head">
          <h2 className="role-section-title">{isZh ? "积分包" : "Credit packs"}</h2>
        </div>
        {isPro && (
          <p className="role-section-desc" style={{ marginBottom: 16, marginTop: -8 }}>
            {isZh ? "一次性购买。积分按月结转，永不过期。" : "One-time purchases. Credits roll over month to month and never expire."}
          </p>
        )}
        <div className="credits-packs-grid">
          {CREDIT_PACKAGES.map((pkg) => (
            <div key={pkg.key} className={`credits-pack-card${!isPro ? " locked" : ""}`}>
              <div className="credits-pack-head">
                <span className="credits-pack-label">
                  {isZh
                    ? pkg.key === "credits_100"
                      ? "100 积分"
                      : pkg.key === "credits_250"
                        ? "250 积分"
                        : "700 积分"
                    : pkg.label}
                </span>
                <span className="credits-pack-price">{pkg.price}</span>
              </div>
              <p className="credits-pack-per-credit">{isZh ? `${pkg.perCredit} / 积分` : `${pkg.perCredit} per credit`}</p>
              <p className="credits-pack-hint">
                {isZh
                  ? pkg.key === "credits_100"
                    ? "适合偶尔补充图像或语音使用。"
                    : pkg.key === "credits_250"
                      ? "在价格和灵活性之间最均衡。"
                      : "适合高频图像或语音使用，性价比最高。"
                  : pkg.hint}
              </p>
              {isPro && (
                <div className="credits-pack-action">
                  <CreemCheckoutButton
                    className="button button-primary"
                    errorLabel={isZh ? "无法启动结账流程。" : "Unable to start checkout."}
                    idleLabel={
                      isZh
                        ? pkg.key === "credits_100"
                          ? "购买 100 积分"
                          : pkg.key === "credits_250"
                            ? "购买 250 积分"
                            : "购买 700 积分"
                        : pkg.buyLabel
                    }
                    kind="credits"
                    selectionKey={pkg.key}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Usage cost ── */}
      <section className="site-card settings-card">
        <div className="role-section-head">
          <h2 className="role-section-title">{isZh ? "每积分使用成本" : "Usage cost per credit"}</h2>
        </div>
        <p className="role-section-desc" style={{ marginBottom: 16, marginTop: -8 }}>
          {isZh ? "实际成本取决于所选模型或资源档位。" : "Cost depends on the model or asset tier selected."}
        </p>
        <div className="credits-cost-grid">
          <div className="settings-meta-card">
            <span className="settings-meta-label">{isZh ? "图像模型" : "Image models"}</span>
            <div className="settings-ops-list">
              <div className="settings-op-item">
                <span>Nano Banana</span>
                <span>2 credits / image</span>
              </div>
              <div className="settings-op-item">
                <span>FLUX.2 Pro</span>
                <span>3 credits / image</span>
              </div>
              <div className="settings-op-item">
                <span>Nano Banana Pro</span>
                <span>4 credits / image</span>
              </div>
            </div>
          </div>
          <div className="settings-meta-card">
            <span className="settings-meta-label">{isZh ? "语音资源" : "Audio assets"}</span>
            <div className="settings-ops-list">
              <div className="settings-op-item">
                <span>{isZh ? "标准语音" : "Standard audio"}</span>
                <span>3 credits / minute</span>
              </div>
              <div className="settings-op-item">
                <span>{isZh ? "高级语音" : "Premium audio"}</span>
                <span>5 credits / minute</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </ProductConsoleShell>
  );
}
