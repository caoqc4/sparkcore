import { redirect } from "next/navigation";

type DashboardPrivacyRedirectPageProps = {
  searchParams: Promise<{
    feedback?: string;
    feedback_type?: string;
    role?: string;
  }>;
};

export default async function DashboardPrivacyRedirectPage({
  searchParams
}: DashboardPrivacyRedirectPageProps) {
  const params = await searchParams;
  const next = new URLSearchParams();

  if (params.feedback) {
    next.set("feedback", params.feedback);
  }

  if (params.feedback_type) {
    next.set("feedback_type", params.feedback_type);
  }

  if (params.role) {
    next.set("role", params.role);
  }

  redirect(`/app/role${next.toString() ? `?${next.toString()}` : ""}`);
}
