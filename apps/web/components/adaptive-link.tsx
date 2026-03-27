"use client";

import Link from "next/link";
import {
  resolveViewerRoute,
  type ViewerPhase,
  type ViewerRouteIntent
} from "@/lib/viewer-shell";
import { useViewerShellState } from "@/components/viewer-shell-provider";

type AdaptiveLabels = Partial<Record<ViewerPhase, React.ReactNode>> & {
  default?: React.ReactNode;
};

type AdaptiveLinkProps = {
  intent: ViewerRouteIntent;
  className?: string;
  labels?: AdaptiveLabels;
  children?: React.ReactNode;
};

export function AdaptiveLink({
  intent,
  className,
  labels,
  children
}: AdaptiveLinkProps) {
  const state = useViewerShellState();
  const href = resolveViewerRoute(intent, state);
  const label = labels?.[state.phase] ?? labels?.default ?? children;

  return (
    <Link className={className} href={href}>
      {label}
    </Link>
  );
}
