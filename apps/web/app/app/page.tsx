import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-redirect";
import { resolveProductAppRoute } from "@/lib/product/route-resolution";
import { createClient } from "@/lib/supabase/server";

export default async function AppConsolePage() {
  const user = await requireUser("/app");
  const supabase = await createClient();
  const resolution = await resolveProductAppRoute({
    supabase,
    userId: user.id,
  });

  if (!resolution || resolution.roleCount === 0 || !resolution.href) {
    redirect("/");
  }

  redirect(resolution.href);
}
