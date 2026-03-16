"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function ThreadUrlSync({
  canonicalThreadId,
  enabled
}: {
  canonicalThreadId: string | null;
  enabled: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!enabled || !canonicalThreadId) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("thread", canonicalThreadId);

    router.replace(`${pathname}?${nextParams.toString()}`);
  }, [canonicalThreadId, enabled, pathname, router, searchParams]);

  return null;
}
