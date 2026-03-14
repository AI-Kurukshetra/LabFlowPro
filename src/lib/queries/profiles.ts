import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "@/lib/types/database";

export const getCurrentProfile = cache(async (supabase: SupabaseClient) => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) throw userError ?? new Error("Not authenticated");

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) throw error;
  return data as Profile;
});

export async function getProfiles(supabase: SupabaseClient) {
  const profile = await getCurrentProfile(supabase);

  if (!profile.organization_id) {
    return [] as Profile[];
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .order("full_name", { ascending: true });

  if (error) throw error;
  return data as Profile[];
}
