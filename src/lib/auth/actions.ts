"use server";

import { redirect } from "next/navigation";

import { getAppUrl, isSupabaseConfigured } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  signInSchema,
  signUpSchema,
  patientSignUpSchema,
} from "@/lib/validations/auth";

export type AuthActionState = {
  status: "idle" | "error" | "success";
  message?: string;
};

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getSafeRedirectTarget(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

export async function signInAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return {
      status: "error",
      message:
        "Supabase environment variables are missing. Add them to .env.local before signing in.",
    };
  }

  const parsed = signInSchema.safeParse({
    email: getString(formData, "email"),
    password: getString(formData, "password"),
    redirectTo: getString(formData, "redirectTo") || undefined,
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const { email, password } = parsed.data;
  const redirectTo = getSafeRedirectTarget(parsed.data.redirectTo || "/dashboard");

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  const supabaseAfterLogin = await createServerSupabaseClient();
  const { data: profile } = await supabaseAfterLogin
    .from("profiles")
    .select("role")
    .eq("id", (await supabaseAfterLogin.auth.getUser()).data.user?.id ?? "")
    .single();

  if (profile?.role === "patient") {
    redirect("/portal");
  }

  redirect(redirectTo);
}

export async function signUpAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return {
      status: "error",
      message:
        "Supabase environment variables are missing. Add them to .env.local before creating accounts.",
    };
  }

  const parsed = signUpSchema.safeParse({
    email: getString(formData, "email"),
    password: getString(formData, "password"),
    confirmPassword: getString(formData, "confirmPassword"),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const { email, password } = parsed.data;

  const emailRedirectTo = getAppUrl() ? `${getAppUrl()}/login` : undefined;
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: emailRedirectTo ? { emailRedirectTo } : undefined,
  });

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  if (!data.session) {
    return {
      status: "success",
      message:
        "Account created. Check your inbox if email confirmation is enabled for this Supabase project.",
    };
  }

  redirect("/dashboard");
}

export async function patientSignUpAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return {
      status: "error",
      message:
        "Supabase environment variables are missing. Add them to .env.local before creating accounts.",
    };
  }

  const parsed = patientSignUpSchema.safeParse({
    fullName: getString(formData, "fullName"),
    email: getString(formData, "email"),
    password: getString(formData, "password"),
    confirmPassword: getString(formData, "confirmPassword"),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const { fullName, email, password } = parsed.data;

  const emailRedirectTo = getAppUrl() ? `${getAppUrl()}/login` : undefined;
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role: "patient", full_name: fullName },
      ...(emailRedirectTo ? { emailRedirectTo } : {}),
    },
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  if (!data.session) {
    return {
      status: "success",
      message:
        "Account created. Check your email for a verification link to activate your patient portal access.",
    };
  }

  redirect("/portal");
}

export async function signOutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
  }

  redirect("/");
}
