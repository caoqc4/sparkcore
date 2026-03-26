import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function encodeNext(nextPath: string) {
  return encodeURIComponent(nextPath);
}

export async function getOptionalUser() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return user;
}

export async function requireUser(nextPath: string) {
  const user = await getOptionalUser();

  if (!user) {
    redirect(`/login?next=${encodeNext(nextPath)}`);
  }

  return user;
}

