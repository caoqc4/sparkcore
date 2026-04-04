import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import "./marketing-refresh.css";
import { ClarityBootstrap } from "@/components/clarity-bootstrap";
import { PostHogBootstrap } from "@/components/posthog-bootstrap";
import { getOptionalClarityEnv, getOptionalPostHogEnv } from "@/lib/env";
import { getSiteLanguageState } from "@/lib/i18n/site";
import { buildPageDescription, buildPageTitle, getMetadataBase } from "@/lib/site";

function isSystemLanguageRoute(pathname: string | null) {
  if (!pathname) return false;

  return (
    pathname === "/app" ||
    pathname.startsWith("/app/") ||
    pathname === "/chat" ||
    pathname.startsWith("/chat/") ||
    pathname === "/connect-im" ||
    pathname.startsWith("/connect-im/") ||
    pathname === "/workspace" ||
    pathname.startsWith("/workspace/")
  );
}

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
    siteName: "Lagun",
    type: "website"
  }
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clarity = getOptionalClarityEnv();
  const posthog = getOptionalPostHogEnv();
  const requestHeaders = await headers();
  const pathname = requestHeaders.get("x-sparkcore-pathname");
  const { contentLanguage, effectiveSystemLanguage } = await getSiteLanguageState();
  const documentLanguage = isSystemLanguageRoute(pathname)
    ? effectiveSystemLanguage
    : contentLanguage;

  return (
    <html lang={documentLanguage}>
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
