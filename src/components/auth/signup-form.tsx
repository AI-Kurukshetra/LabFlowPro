"use client";

import { useActionState } from "react";

import {
  type AuthActionState,
  signUpAction,
} from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const initialState: AuthActionState = {
  status: "idle",
};

type SignupFormProps = {
  disabled?: boolean;
};

export function SignupForm({ disabled = false }: SignupFormProps) {
  const [state, formAction, isPending] = useActionState(
    signUpAction,
    initialState
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Minimum 8 characters"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Repeat your password"
          required
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
        {isPending ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
}
