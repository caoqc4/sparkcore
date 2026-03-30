"use client";

import { useState } from "react";
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
};

export function BillingCadenceSelector({ checkoutHref }: BillingCadenceSelectorProps) {
  const [selected, setSelected] = useState<"monthly" | "quarterly" | "yearly">("monthly");
  const current = CADENCES.find((c) => c.key === selected)!;

  return (
    <div className="cadence-selector">
      <p className="cadence-selector-label">Choose billing period</p>
      <div className="cadence-options">
        {CADENCES.map((c) => (
          <button
            key={c.key}
            className={`cadence-option${selected === c.key ? " selected" : ""}`}
            onClick={() => setSelected(c.key)}
            type="button"
          >
            {c.savingsLabel && (
              <span className="cadence-savings-badge">{c.savingsLabel}</span>
            )}
            <span className="cadence-option-label">{c.label}</span>
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
            idleLabel={`Upgrade to Pro · ${current.price}`}
            pendingLabel="Redirecting to checkout…"
            kind="subscription"
            selectionKey={selected}
          />
        ) : (
          <button className="button button-primary cadence-upgrade-btn" disabled type="button">
            Upgrade to Pro
          </button>
        )}
        <span className="cadence-hint">{current.billingNote}</span>
      </div>
    </div>
  );
}
