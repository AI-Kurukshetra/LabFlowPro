import type { ReactNode } from "react";
import Link from "next/link";
import { CheckCircle2, FlaskConical } from "lucide-react";

import { LogoMark } from "@/components/brand/logo-mark";

type AuthShellProps = {
  children: ReactNode;
};

const features = [
  "Patient intake in under 2 minutes",
  "Real-time specimen tracking across every handoff",
  "Supervisor-controlled result approval and release",
  "Full audit trail on every critical action",
  "PDF, CSV, and JSON report exports",
];

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="flex min-h-screen">
      {/* ---- Left panel (brand) ---- */}
      <div className="relative hidden w-[480px] shrink-0 flex-col justify-between overflow-hidden bg-slate-950 p-10 lg:flex xl:w-[520px]">
        {/* Subtle accent glow */}
        <div className="pointer-events-none absolute -left-20 -top-20 size-80 rounded-full bg-teal-500/10 blur-3xl" />

        <div className="relative">
          <Link href="/">
            <LogoMark inverted />
          </Link>
        </div>

        <div className="relative space-y-6">
          <FlaskConical className="size-10 text-teal-400" />
          <h2 className="text-2xl font-bold leading-snug tracking-tight text-white">
            The daily operating system for modern diagnostic labs.
          </h2>
          <ul className="space-y-3">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-teal-400" />
                <span className="text-sm leading-relaxed text-slate-300">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-slate-600">
          &copy; {new Date().getFullYear()} LabFlow Pro
        </p>
      </div>

      {/* ---- Right panel (form) ---- */}
      <div className="flex flex-1 flex-col">
        {/* Mobile header */}
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4 lg:hidden">
          <Link href="/">
            <LogoMark compact />
          </Link>
          <Link href="/" className="text-sm font-medium text-slate-600 hover:text-slate-950">
            Back to home
          </Link>
        </header>

        {/* Desktop top-right nav */}
        <div className="hidden justify-end px-8 pt-6 lg:flex">
          <Link href="/" className="text-sm font-medium text-slate-500 hover:text-slate-950">
            Back to home
          </Link>
        </div>

        <main className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
