import { redirect } from "next/navigation";

type DashboardMemoryPageProps = {
  searchParams: Promise<{
    feedback?: string;
    feedback_type?: string;
    role?: string;
    thread?: string;
  }>;
};

export default async function AppMemoryPage({
  searchParams,
}: DashboardMemoryPageProps) {
  const params = await searchParams;
  const next = new URLSearchParams();

  if (params.role) {
    next.set("role", params.role);
  }

  if (params.thread) {
    next.set("thread", params.thread);
  }

  if (params.feedback) {
    next.set("feedback", params.feedback);
  }

  if (params.feedback_type) {
    next.set("feedback_type", params.feedback_type);
  }

  redirect(`/app/role${next.toString() ? `?${next.toString()}` : ""}`);
}
