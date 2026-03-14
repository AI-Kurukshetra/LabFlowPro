"use client";

import { useActionState, useState, useCallback } from "react";
import { Mail, Lock, LogIn } from "lucide-react";

import {
  type AuthActionState,
  signInAction,
} from "@/lib/auth/actions";
import { signInSchema } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const initialState: AuthActionState = { status: "idle" };

type LoginFormProps = {
  disabled?: boolean;
  redirectTo?: string;
};

export function LoginForm({
  disabled = false,
  redirectTo = "/dashboard",
}: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(signInAction, initialState);

  const [values, setValues] = useState({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validate = useCallback((field: string, newValues: typeof values) => {
    const result = signInSchema.safeParse(newValues);
    if (result.success) {
      setFieldErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
    } else {
      const issue = result.error.issues.find((i) => i.path[0] === field);
      setFieldErrors((prev) => issue
        ? { ...prev, [field]: issue.message }
        : (() => { const next = { ...prev }; delete next[field]; return next; })()
      );
    }
  }, []);

  const handleChange = useCallback((field: keyof typeof values, value: string) => {
    const newValues = { ...values, [field]: value };
    setValues(newValues);
    if (touched[field]) validate(field, newValues);
  }, [values, touched, validate]);

  const handleBlur = useCallback((field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validate(field, values);
  }, [values, validate]);

  const err = (field: string) => fieldErrors[field] || (state.fieldErrors?.[field] && !touched[field] ? state.fieldErrors[field] : undefined);

  return (
    <form action={formAction} noValidate className="space-y-5">
      <input type="hidden" name="redirectTo" value={redirectTo} />

      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email address</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            id="email" name="email" type="email" autoComplete="email"
            placeholder="you@example.com"
            value={values.email}
            onChange={(e) => handleChange("email", e.target.value)}
            onBlur={() => handleBlur("email")}
            className={cn(
              "h-11 w-full rounded-lg border bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400",
              err("email")
                ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                : "border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            )}
          />
        </div>
        {err("email") && <p className="text-xs font-medium text-red-500">{err("email")}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            id="password" name="password" type="password" autoComplete="current-password"
            placeholder="Enter your password"
            value={values.password}
            onChange={(e) => handleChange("password", e.target.value)}
            onBlur={() => handleBlur("password")}
            className={cn(
              "h-11 w-full rounded-lg border bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400",
              err("password")
                ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                : "border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            )}
          />
        </div>
        {err("password") && <p className="text-xs font-medium text-red-500">{err("password")}</p>}
      </div>

      {state.message && (
        <div
          aria-live="polite" role="alert"
          className={cn(
            "rounded-lg border px-4 py-3 text-sm",
            state.status === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          )}
        >
          {state.message}
        </div>
      )}

      <Button className="h-11 w-full rounded-lg text-sm font-semibold" disabled={disabled || isPending}>
        {isPending ? (
          <span className="flex items-center gap-2">
            <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Signing in...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <LogIn className="size-4" />
            Sign in
          </span>
        )}
      </Button>
    </form>
  );
}
