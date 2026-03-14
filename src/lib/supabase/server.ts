import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabaseCredentials } from "@/lib/env";

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  const { url, clientKey } = getSupabaseCredentials();

  return createServerClient(url, clientKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot always write cookies. Middleware handles refreshes.
        }
      },
    },
  });
}
