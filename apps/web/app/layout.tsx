import type { Metadata } from "next";
import "./globals.css";
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
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
