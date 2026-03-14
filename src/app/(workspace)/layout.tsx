import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/workspace/app-shell";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentProfile } from "@/lib/queries/profiles";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type WorkspaceLayoutProps = {
  children: ReactNode;
};

export default async function WorkspaceLayout({
  children,
}: WorkspaceLayoutProps) {
  const previewMode = !isSupabaseConfigured();

  if (previewMode) {
    return (
      <AppShell previewMode userLabel="Preview workspace" userRole="admin">
        {children}
      </AppShell>
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let userRole: "admin" | "intake" | "technician" | "reviewer" = "technician";
  try {
    const profile = await getCurrentProfile(supabase);
    if (profile.role === "patient") {
      redirect("/portal");
    }
    userRole = profile.role as "admin" | "intake" | "technician" | "reviewer";
  } catch {
    // Fall back to technician if profile fetch fails
  }

  return (
    <AppShell previewMode={false} userLabel={user.email ?? "Authenticated user"} userRole={userRole}>
      {children}
    </AppShell>
  );
}
