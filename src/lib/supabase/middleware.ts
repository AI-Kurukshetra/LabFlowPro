import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseCredentials, isSupabaseConfigured } from "@/lib/env";

const authPaths = new Set(["/login", "/signup", "/patient-signup"]);
const protectedPrefixes = [
  "/dashboard",
  "/patients",
  "/orders",
  "/specimens",
  "/results",
  "/reports",
  "/admin",
  "/portal",
];

const workspacePrefixes = [
  "/dashboard",
  "/patients",
  "/orders",
  "/specimens",
  "/results",
  "/reports",
  "/admin",
];

function isWorkspacePath(pathname: string) {
  return workspacePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function isPortalPath(pathname: string) {
  return pathname === "/portal" || pathname.startsWith("/portal/");
}

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export async function updateSession(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.next();
  }

  const { url, clientKey } = getSupabaseCredentials();
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(url, clientKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (!user && isProtectedPath(pathname)) {
    const loginUrl = new URL("/login", request.url);
    const redirectTarget = `${pathname}${request.nextUrl.search}`;
    loginUrl.searchParams.set("next", redirectTarget);
    return NextResponse.redirect(loginUrl);
  }

  if (user) {
    let userRole: string | null = null;

    if (authPaths.has(pathname) || isProtectedPath(pathname)) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      userRole = profile?.role ?? null;
    }

    if (authPaths.has(pathname)) {
      const target = userRole === "patient" ? "/portal" : "/dashboard";
      return NextResponse.redirect(new URL(target, request.url));
    }

    if (userRole === "patient" && isWorkspacePath(pathname)) {
      return NextResponse.redirect(new URL("/portal", request.url));
    }

    if (userRole !== null && userRole !== "patient" && isPortalPath(pathname)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return response;
}
