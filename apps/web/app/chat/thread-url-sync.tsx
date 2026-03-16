"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function ThreadUrlSync({
  canonicalThreadId,
  clearTransientFeedback,
  enabled
}: {
  canonicalThreadId: string | null;
  clearTransientFeedback?: boolean;
  enabled: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams.toString());
    let shouldReplace = false;

    if (enabled && canonicalThreadId && nextParams.get("thread") !== canonicalThreadId) {
      nextParams.set("thread", canonicalThreadId);
      shouldReplace = true;
    }

    if (clearTransientFeedback) {
      for (const key of ["feedback", "feedback_type", "error"]) {
        if (nextParams.has(key)) {
          nextParams.delete(key);
          shouldReplace = true;
        }
      }
    }

    if (!shouldReplace) {
      return;
    }

    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname);
  }, [
    canonicalThreadId,
    clearTransientFeedback,
    enabled,
    pathname,
    router,
    searchParams
  ]);

  return null;
}
