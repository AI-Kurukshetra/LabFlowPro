const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseClientKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseClientKey);
}

export function getSupabaseCredentials() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL and a public Supabase key. Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return {
    url: supabaseUrl!,
    clientKey: supabaseClientKey!,
  };
}

export function getAppUrl() {
  return appUrl;
}

export function getOpenAIApiKey() {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new Error("Missing OPENAI_API_KEY environment variable.");
  }
  return key;
}
