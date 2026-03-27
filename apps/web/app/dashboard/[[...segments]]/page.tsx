import { permanentRedirect } from "next/navigation";

type LegacyDashboardRedirectPageProps = {
  params: Promise<{
    segments?: string[];
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";

export default async function LegacyDashboardRedirectPage({
  params,
  searchParams,
}: LegacyDashboardRedirectPageProps) {
  const { segments = [] } = await params;
  const query = await searchParams;
  const nextQuery = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (typeof value === "string") {
      nextQuery.set(key, value);
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        nextQuery.append(key, item);
      }
    }
  }

  const pathname = segments.length > 0 ? `/app/${segments.join("/")}` : "/app";
  const queryString = nextQuery.toString();

  permanentRedirect(queryString ? `${pathname}?${queryString}` : pathname);
}
