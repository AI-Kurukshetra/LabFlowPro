"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";

import { signOutAction } from "@/lib/auth/actions";
import { LogoMark } from "@/components/brand/logo-mark";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { portalNavItems } from "@/lib/portal-navigation";
import { cn } from "@/lib/utils";

type PortalShellProps = {
  children: React.ReactNode;
  patientName: string;
  patientRef: string;
};

function getInitials(name: string) {
  const parts = name
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase());
  return parts.join("") || "PT";
}

export function PortalShell({ children, patientName, patientRef }: PortalShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-slate-950 text-white lg:flex">
        <div className="flex h-full flex-col p-5">
          <div className="space-y-6">
            <LogoMark inverted compact />
          </div>

          <div className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Patient Portal
            </p>
            <nav className="mt-3 space-y-1">
              {portalNavItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === "/portal"
                    ? pathname === "/portal"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                      isActive
                        ? "bg-white/10 font-medium text-white"
                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <div className="min-w-0">
                      <p className={cn("truncate", isActive ? "text-white" : "text-slate-300")}>
                        {item.title}
                      </p>
                      <p className="truncate text-xs text-slate-500">{item.description}</p>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-slate-950">
                Patient Portal
              </h1>
              <p className="hidden text-sm text-slate-600 sm:block">
                View your lab results, reports, and get AI-powered health insights.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-3 sm:flex">
                <Avatar size="sm" className="ring-2 ring-teal-500/40">
                  <AvatarFallback>{getInitials(patientName)}</AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-950">{patientName}</p>
                    <Badge
                      variant="outline"
                      className="bg-rose-50 text-rose-700 border-rose-200 text-xs"
                    >
                      {patientRef}
                    </Badge>
                  </div>
                  <p className="text-slate-500">Patient</p>
                </div>
              </div>

              <Separator orientation="vertical" className="hidden h-6 sm:block" />

              <form action={signOutAction}>
                <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700">
                  <LogOut className="size-4" />
                  <span className="hidden sm:inline">Sign out</span>
                </Button>
              </form>
            </div>
          </div>

          {/* Mobile nav */}
          <div className="relative mt-4 lg:hidden"><div className="flex gap-1 overflow-x-auto">
            {portalNavItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/portal"
                  ? pathname === "/portal"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-teal-50 text-teal-700"
                      : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <Icon className="size-3.5" />
                  {item.title}
                </Link>
              );
            })}
          </div><div className="pointer-events-none absolute right-0 top-0 h-full w-6 bg-gradient-to-l from-white to-transparent" /></div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-4 py-6 bg-slate-50 sm:px-6 sm:py-8 lg:px-8">
          <div className="w-full max-w-[1600px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
