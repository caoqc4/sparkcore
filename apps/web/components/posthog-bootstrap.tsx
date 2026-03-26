"use client";

import { useEffect } from "react";
import { initProductAnalytics } from "@/lib/product/events";

type PostHogBootstrapProps = {
  apiKey: string;
  apiHost: string;
};

export function PostHogBootstrap({
  apiKey,
  apiHost
}: PostHogBootstrapProps) {
  useEffect(() => {
    initProductAnalytics({
      apiKey,
      apiHost
    });
  }, [apiHost, apiKey]);

  return null;
}
