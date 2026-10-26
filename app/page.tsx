import { redirect } from "next/navigation";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";
import Workspace from "@/components/Workspace";
import SetupNotice from "@/components/SetupNotice";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!hasSupabaseEnv()) return <SetupNotice />;

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  return (
    <Workspace
      userId={data.user.id}
      email={data.user.email ?? ""}
      aiEnabled={Boolean(process.env.ANTHROPIC_API_KEY)}
    />
  );
}
