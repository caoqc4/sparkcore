"use client";

import { useState } from "react";

type CreemCheckoutButtonProps = {
  kind: "subscription" | "credits";
  selectionKey: string;
  idleLabel: string;
  pendingLabel?: string;
  disabled?: boolean;
  className?: string;
};

export function CreemCheckoutButton({
  kind,
  selectionKey,
  idleLabel,
  pendingLabel = "Redirecting…",
  disabled = false,
  className,
}: CreemCheckoutButtonProps) {
  const [pending, setPending] = useState(false);

  return (
    <button
      className={className}
      disabled={disabled || pending}
      onClick={async () => {
        try {
          setPending(true);
          const response = await fetch("/api/payments/creem/checkout", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              kind,
              key: selectionKey,
            }),
          });

          const payload = (await response.json()) as { url?: string; error?: string };
          if (!response.ok || !payload.url) {
            throw new Error(payload.error || "Unable to start checkout.");
          }

          window.location.href = payload.url;
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unable to start checkout.";
          window.alert(message);
          setPending(false);
        }
      }}
      type="button"
    >
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}
