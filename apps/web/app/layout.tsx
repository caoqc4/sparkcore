import type { Metadata } from "next";
import "./globals.css";
import "./marketing-refresh.css";
import { ClarityBootstrap } from "@/components/clarity-bootstrap";
import { PostHogBootstrap } from "@/components/posthog-bootstrap";
import { getOptionalClarityEnv, getOptionalPostHogEnv } from "@/lib/env";
import { buildPageDescription, buildPageTitle, getMetadataBase } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: buildPageTitle(),
    template: "%s"
  },
  description: buildPageDescription(),
  openGraph: {
    title: buildPageTitle(),
    description: buildPageDescription(),
    url: "/",
    siteName: "SparkCore",
    type: "website"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clarity = getOptionalClarityEnv();
  const posthog = getOptionalPostHogEnv();

  return (
    <html lang="en">
      <body>
        {clarity ? <ClarityBootstrap projectId={clarity.projectId} /> : null}
        {posthog ? (
          <PostHogBootstrap apiHost={posthog.apiHost} apiKey={posthog.apiKey} />
        ) : null}
        {children}
      </body>
    </html>
  );
}
