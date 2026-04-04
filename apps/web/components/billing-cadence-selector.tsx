"use client";

import { useState } from "react";
import type { AppLanguage } from "@/lib/i18n/site";
import { CreemCheckoutButton } from "./creem-checkout-button";

const CADENCES = [
  {
    key: "monthly" as const,
    label: "Monthly",
    price: "$14.99",
    period: "/ mo",
    perMonthNote: null,
    savingsLabel: null,
    billingNote: "Cancel anytime. Billed monthly.",
  },
  {
    key: "quarterly" as const,
    label: "Quarterly",
    price: "$39.99",
    period: "/ qtr",
    perMonthNote: "~$13.33 / mo",
    savingsLabel: "Save 11%",
    billingNote: "Billed $39.99 every 3 months.",
  },
  {
    key: "yearly" as const,
    label: "Yearly",
    price: "$99.99",
    period: "/ yr",
    perMonthNote: "~$8.33 / mo",
    savingsLabel: "Save 44%",
    billingNote: "Billed $99.99 once per year. Best value.",
  },
];

type BillingCadenceSelectorProps = {
  checkoutHref: string | null;
  language?: AppLanguage;
};

export function BillingCadenceSelector({ checkoutHref, language = "en" }: BillingCadenceSelectorProps) {
  const isZh = language === "zh-CN";
  const [selected, setSelected] = useState<"monthly" | "quarterly" | "yearly">("monthly");
  const current = CADENCES.find((c) => c.key === selected)!;
  const cadenceLabels = isZh
    ? {
        monthly: "月付",
        quarterly: "季付",
        yearly: "年付",
      }
    : {
        monthly: "Monthly",
        quarterly: "Quarterly",
        yearly: "Yearly",
      };
  const savingsLabels = isZh
    ? {
        "Save 11%": "省 11%",
        "Save 44%": "省 44%",
      }
    : {
        "Save 11%": "Save 11%",
        "Save 44%": "Save 44%",
      };
  const billingNotes = {
    monthly: isZh ? "可随时取消，按月计费。" : "Cancel anytime. Billed monthly.",
    quarterly: isZh ? "每 3 个月计费 $39.99。" : "Billed $39.99 every 3 months.",
    yearly: isZh ? "每年一次性计费 $99.99，性价比最高。" : "Billed $99.99 once per year. Best value.",
  };

  return (
    <div className="cadence-selector">
      <p className="cadence-selector-label">{isZh ? "选择计费周期" : "Choose billing period"}</p>
      <div className="cadence-options">
        {CADENCES.map((c) => (
          <button
            key={c.key}
            className={`cadence-option${selected === c.key ? " selected" : ""}`}
            onClick={() => setSelected(c.key)}
            type="button"
          >
            {c.savingsLabel && (
              <span className="cadence-savings-badge">{savingsLabels[c.savingsLabel as keyof typeof savingsLabels]}</span>
            )}
            <span className="cadence-option-label">{cadenceLabels[c.key]}</span>
            <div className="cadence-option-pricing">
              <span className="cadence-option-price">{c.price}</span>
              <span className="cadence-option-period">{c.period}</span>
            </div>
            {c.perMonthNote && (
              <span className="cadence-option-per-month">{c.perMonthNote}</span>
            )}
          </button>
        ))}
      </div>
      <div className="cadence-cta-row">
        {checkoutHref ? (
          <CreemCheckoutButton
            className="button button-primary cadence-upgrade-btn"
            idleLabel={isZh ? `升级到 Pro · ${current.price}` : `Upgrade to Pro · ${current.price}`}
            pendingLabel={isZh ? "正在跳转到结账页面…" : "Redirecting to checkout…"}
            kind="subscription"
            selectionKey={selected}
          />
        ) : (
          <button className="button button-primary cadence-upgrade-btn" disabled type="button">
            {isZh ? "升级到 Pro" : "Upgrade to Pro"}
          </button>
        )}
        <span className="cadence-hint">{billingNotes[current.key]}</span>
      </div>
    </div>
  );
}
