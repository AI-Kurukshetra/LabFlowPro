"use client";

import { useActionState } from "react";

import {
  type AuthActionState,
  signInAction,
} from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const initialState: AuthActionState = {
  status: "idle",
};

type LoginFormProps = {
  disabled?: boolean;
  redirectTo?: string;
};

export function LoginForm({
  disabled = false,
  redirectTo = "/dashboard",
}: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(
    signInAction,
    initialState
  );

  return (
    <form action={formAction} noValidate className="space-y-4">
      <input type="hidden" name="redirectTo" value={redirectTo} />

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
                  />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
                  />
      </div>

      {state.message ? (
        <div
          aria-live="polite"
          role={state.status === "error" ? "alert" : "status"}
          className={cn(
            "rounded-lg border px-4 py-3 text-sm",
            state.status === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          )}
        >
          {state.message}
        </div>
      ) : null}

      <Button
        className="w-full rounded-lg"
        disabled={disabled || isPending}
      >
        {isPending ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
