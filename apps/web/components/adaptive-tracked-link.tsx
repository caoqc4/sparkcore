"use client";

import Link from "next/link";
import {
  trackProductEvent,
  type ProductEventName,
  type ProductEventPayload
} from "@/lib/product/events";
import {
  resolveViewerRoute,
  type ViewerPhase,
  type ViewerRouteIntent
} from "@/lib/viewer-shell";
import { useViewerShellState } from "@/components/viewer-shell-provider";

type AdaptiveLabels = Partial<Record<ViewerPhase, React.ReactNode>> & {
  default?: React.ReactNode;
};

type AdaptiveTrackedLinkProps = {
  intent: ViewerRouteIntent;
  className?: string;
  event: ProductEventName;
  payload?: ProductEventPayload;
  labels?: AdaptiveLabels;
  children?: React.ReactNode;
};

export function AdaptiveTrackedLink({
  intent,
  className,
  event,
  payload,
  labels,
  children
}: AdaptiveTrackedLinkProps) {
  const state = useViewerShellState();
  const href = resolveViewerRoute(intent, state);
  const label = labels?.[state.phase] ?? labels?.default ?? children;

  return (
    <Link
      className={className}
      href={href}
      onClick={() => trackProductEvent(event, payload ?? {})}
    >
      {label}
    </Link>
  );
}
