"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { workspaceNavItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/types/database";

type WorkspaceNavProps = {
  mode?: "sidebar" | "compact";
  userRole?: UserRole;
};

export function WorkspaceNav({ mode = "sidebar", userRole }: WorkspaceNavProps) {
  const pathname = usePathname();
  const compact = mode === "compact";

  const visibleItems = userRole
    ? workspaceNavItems.filter((item) => item.allowedRoles.includes(userRole))
    : workspaceNavItems;

  return (
    <nav
      aria-label="Workspace navigation"
      className={cn(
        compact ? "flex gap-2 overflow-x-auto pb-1" : "flex flex-col gap-1.5"
      )}
    >
      {visibleItems.map(({ title, href, description, icon: Icon }) => {
        const active = pathname === href;

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "group transition-colors",
              compact
                ? cn(
                    "inline-flex min-w-fit items-center gap-2 rounded-lg border px-4 py-2.5",
                    active
                      ? "border-primary/20 bg-primary/10 text-slate-950"
                      : "border-slate-200 bg-white text-slate-600 hover:border-primary/25 hover:text-slate-950"
                  )
                : cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5",
                    active
                      ? "bg-white/10 text-white"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  )
            )}
          >
            <span
              className={cn(
                "flex shrink-0 items-center justify-center rounded-lg",
                compact ? "size-7" : "size-8",
                active
                  ? compact
                    ? "bg-primary/10 text-primary"
                    : "bg-primary/15 text-teal-300"
                  : compact
                    ? "bg-slate-100 text-slate-400"
                    : "bg-white/5 text-slate-500"
              )}
            >
              <Icon className="size-4" />
            </span>

            <span className="min-w-0">
              <span
                className={cn(
                  "block truncate font-medium",
                  compact ? "text-sm" : "text-sm"
                )}
              >
                {title}
              </span>
              {!compact ? (
                <span
                  className={cn(
                    "block text-xs leading-snug",
                    active ? "text-slate-400" : "text-slate-500"
                  )}
                >
                  {description}
                </span>
              ) : null}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
