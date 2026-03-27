import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/site";

export const metadata = buildPageMetadata({
  title: "App Console",
  description:
    "Protected SparkCore control surfaces for memory, channels, boundaries, and supplementary chat.",
  path: "/app",
  noIndex: true,
});

export default function AppLayout({ children }: { children: ReactNode }) {
  return children;
}
