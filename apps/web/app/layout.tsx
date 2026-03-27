import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import "./marketing-refresh.css";
import { ClarityBootstrap } from "@/components/clarity-bootstrap";
import { PostHogBootstrap } from "@/components/posthog-bootstrap";
import { getOptionalClarityEnv, getOptionalPostHogEnv } from "@/lib/env";
import { buildPageDescription, buildPageTitle, getMetadataBase } from "@/lib/site";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-ui",
  display: "swap"
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap"
});

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
    <html className={`${plusJakartaSans.variable} ${fraunces.variable}`} lang="en">
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
