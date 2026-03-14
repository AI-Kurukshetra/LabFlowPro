import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseCredentials } from "@/lib/env";

export function createBrowserSupabaseClient() {
  const { url, clientKey } = getSupabaseCredentials();

  return createBrowserClient(url, clientKey);
}
