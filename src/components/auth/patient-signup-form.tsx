"use client";

import { useActionState, useState, useCallback } from "react";
import { Mail, Lock, User, HeartPulse } from "lucide-react";

import {
  type AuthActionState,
  patientSignUpAction,
} from "@/lib/auth/actions";
import { patientSignUpSchema } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const initialState: AuthActionState = { status: "idle" };

type PatientSignupFormProps = { disabled?: boolean };

function FormInput({
  id, name, type, autoComplete, placeholder, label, value, onChange, onBlur, error, icon: Icon,
}: {
  id: string; name: string; type: string; autoComplete: string; placeholder: string; label: string;
  value: string; onChange: (v: string) => void; onBlur: () => void; error?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium text-slate-700">{label}</Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          id={id} name={name} type={type} autoComplete={autoComplete} placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className={cn(
            "h-11 w-full rounded-lg border bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400",
            error
              ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
              : "border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          )}
        />
      </div>
      {error && <p className="text-xs font-medium text-red-500">{error}</p>}
    </div>
  );
}

export function PatientSignupForm({ disabled = false }: PatientSignupFormProps) {
  const [state, formAction, isPending] = useActionState(patientSignUpAction, initialState);

  const [values, setValues] = useState({ fullName: "", email: "", password: "", confirmPassword: "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validate = useCallback((field: string, newValues: typeof values) => {
    const result = patientSignUpSchema.safeParse(newValues);
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
    if (field === "password" && touched.confirmPassword) validate("confirmPassword", newValues);
  }, [values, touched, validate]);

  const handleBlur = useCallback((field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validate(field, values);
  }, [values, validate]);

  const err = (field: string) => fieldErrors[field] || (state.fieldErrors?.[field] && !touched[field] ? state.fieldErrors[field] : undefined);

  return (
    <form action={formAction} noValidate className="space-y-5">
      <FormInput id="fullName" name="fullName" type="text" autoComplete="name"
        label="Full Name" placeholder="Your full name" icon={User}
        value={values.fullName} onChange={(v) => handleChange("fullName", v)}
        onBlur={() => handleBlur("fullName")} error={err("fullName")} />

      <FormInput id="email" name="email" type="email" autoComplete="email"
        label="Email address" placeholder="you@example.com" icon={Mail}
        value={values.email} onChange={(v) => handleChange("email", v)}
        onBlur={() => handleBlur("email")} error={err("email")} />

      <FormInput id="password" name="password" type="password" autoComplete="new-password"
        label="Password" placeholder="Minimum 8 characters" icon={Lock}
        value={values.password} onChange={(v) => handleChange("password", v)}
        onBlur={() => handleBlur("password")} error={err("password")} />

      <FormInput id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password"
        label="Confirm password" placeholder="Repeat your password" icon={Lock}
        value={values.confirmPassword} onChange={(v) => handleChange("confirmPassword", v)}
        onBlur={() => handleBlur("confirmPassword")} error={err("confirmPassword")} />

      {state.message && (
        <div aria-live="polite" role={state.status === "error" ? "alert" : "status"}
          className={cn("rounded-lg border px-4 py-3 text-sm",
            state.status === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"
          )}>
          {state.message}
        </div>
      )}

      <Button className="h-11 w-full rounded-lg text-sm font-semibold" disabled={disabled || isPending}>
        {isPending ? (
          <span className="flex items-center gap-2">
            <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Creating account...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <HeartPulse className="size-4" />
            Create patient account
          </span>
        )}
      </Button>
    </form>
  );
}
