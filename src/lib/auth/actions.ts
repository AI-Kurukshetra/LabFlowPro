"use server";

import { redirect } from "next/navigation";

import { getAppUrl, isSupabaseConfigured } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AuthActionState = {
  status: "idle" | "error" | "success";
  message?: string;
};

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function isValidEmail(email: string) {
  return /\S+@\S+\.\S+/.test(email);
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

  const email = getString(formData, "email");
  const password = getString(formData, "password");
  const redirectTo = getSafeRedirectTarget(
    getString(formData, "redirectTo") || "/dashboard"
  );

  if (!isValidEmail(email)) {
    return {
      status: "error",
      message: "Enter a valid email address.",
    };
  }

  if (password.length < 8) {
    return {
      status: "error",
      message: "Password must be at least 8 characters.",
    };
  }

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

  const email = getString(formData, "email");
  const password = getString(formData, "password");
  const confirmPassword = getString(formData, "confirmPassword");

  if (!isValidEmail(email)) {
    return {
      status: "error",
      message: "Enter a valid email address.",
    };
  }

  if (password.length < 8) {
    return {
      status: "error",
      message: "Password must be at least 8 characters.",
    };
  }

  if (password !== confirmPassword) {
    return {
      status: "error",
      message: "Passwords do not match.",
    };
  }

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

  const fullName = getString(formData, "fullName");
  const email = getString(formData, "email");
  const password = getString(formData, "password");
  const confirmPassword = getString(formData, "confirmPassword");

  if (!fullName) {
    return { status: "error", message: "Full name is required." };
  }

  if (!isValidEmail(email)) {
    return { status: "error", message: "Enter a valid email address." };
  }

  if (password.length < 8) {
    return { status: "error", message: "Password must be at least 8 characters." };
  }

  if (password !== confirmPassword) {
    return { status: "error", message: "Passwords do not match." };
  }

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
