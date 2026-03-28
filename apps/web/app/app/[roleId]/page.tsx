import { redirect } from "next/navigation";

type AppConsolePageProps = {
  params: Promise<{
    roleId: string;
  }>;
};

export default async function AppConsolePage({ params }: AppConsolePageProps) {
  const { roleId } = await params;
  redirect(`/app/chat?role=${encodeURIComponent(roleId)}`);
}
