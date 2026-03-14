import type { ReactNode } from "react";
import { LogOut } from "lucide-react";

import { signOutAction } from "@/lib/auth/actions";
import { LogoMark } from "@/components/brand/logo-mark";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { WorkspaceNav } from "@/components/workspace/workspace-nav";
import type { UserRole } from "@/lib/types/database";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: ReactNode;
  userLabel: string;
  previewMode: boolean;
  userRole: UserRole;
};

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  intake: "Intake",
  technician: "Technician",
  reviewer: "Reviewer",
  patient: "Patient",
};

const ROLE_BADGE_COLORS: Record<UserRole, string> = {
  admin: "bg-teal-100 text-teal-700 border-teal-200",
  intake: "bg-sky-100 text-sky-700 border-sky-200",
  technician: "bg-amber-100 text-amber-700 border-amber-200",
  reviewer: "bg-violet-100 text-violet-700 border-violet-200",
  patient: "bg-rose-100 text-rose-700 border-rose-200",
};

function getInitials(userLabel: string) {
  const parts = userLabel
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase());

  return parts.join("") || "LF";
}

export function AppShell({ children, userLabel, previewMode, userRole }: AppShellProps) {
  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-slate-950 text-white lg:flex">
        <div className="flex flex-col h-full p-5">
          <div className="space-y-6">
            <LogoMark inverted compact />
          </div>

          <div className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Navigate
            </p>
            <div className="mt-3">
              <WorkspaceNav userRole={userRole} />
            </div>
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
                Laboratory operations
              </h1>
              <p className="hidden text-sm text-slate-600 sm:block">
                Manage patient intake, specimens, results, reports, and admin controls.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-3 sm:flex">
                <Avatar size="sm" className="ring-2 ring-teal-500/40">
                  <AvatarFallback>{getInitials(userLabel)}</AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-950">{userLabel}</p>
                    <Badge
                      variant="outline"
                      className={cn("text-xs", ROLE_BADGE_COLORS[userRole])}
                    >
                      {ROLE_LABELS[userRole]}
                    </Badge>
                  </div>
                  <p className="text-slate-500">Workspace member</p>
                </div>
              </div>
              {previewMode ? null : (
                <>
                  <Separator orientation="vertical" className="hidden h-6 sm:block" />
                  <form action={signOutAction}>
                    <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700">
                      <LogOut className="size-4" />
                      <span className="hidden sm:inline">Sign out</span>
                    </Button>
                  </form>
                </>
              )}
            </div>
          </div>

          <div className="mt-4 lg:hidden">
            <WorkspaceNav mode="compact" userRole={userRole} />
          </div>
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
