"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type CheckoutFeedbackRefreshProps = {
  enabled: boolean;
  delayMs?: number;
};

export function CheckoutFeedbackRefresh({
  enabled,
  delayMs = 1800,
}: CheckoutFeedbackRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const timeout = window.setTimeout(() => {
      router.refresh();
    }, delayMs);

    return () => window.clearTimeout(timeout);
  }, [delayMs, enabled, router]);

  return null;
}
