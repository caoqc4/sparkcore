import { redirect } from "next/navigation";

type DashboardChannelsRedirectPageProps = {
  searchParams: Promise<{
    feedback?: string;
    feedback_type?: string;
    role?: string;
  }>;
};

export default async function DashboardChannelsRedirectPage({
  searchParams
}: DashboardChannelsRedirectPageProps) {
  const params = await searchParams;
  const next = new URLSearchParams({ tab: "channels" });

  if (params.feedback) {
    next.set("feedback", params.feedback);
  }

  if (params.feedback_type) {
    next.set("feedback_type", params.feedback_type);
  }

  if (params.role) {
    next.set("role", params.role);
  }

  redirect(`/app/settings?${next.toString()}`);
}
