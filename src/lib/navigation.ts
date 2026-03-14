import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Cable,
  ClipboardList,
  FileCheck2,
  FileOutput,
  LayoutDashboard,
  Settings2,
  TestTube2,
  Users2,
} from "lucide-react";

import type { UserRole } from "@/lib/types/database";

export type WorkspaceNavItem = {
  title: string;
  href: string;
  description: string;
  icon: LucideIcon;
  allowedRoles: UserRole[];
};

export const workspaceNavItems: WorkspaceNavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    description: "Live operational view",
    icon: LayoutDashboard,
    allowedRoles: ["admin", "intake", "technician", "reviewer"],
  },
  {
    title: "Patients",
    href: "/patients",
    description: "Demographics and history",
    icon: Users2,
    allowedRoles: ["admin", "intake"],
  },
  {
    title: "Orders",
    href: "/orders",
    description: "Requests and priorities",
    icon: ClipboardList,
    allowedRoles: ["admin", "intake", "technician", "reviewer"],
  },
  {
    title: "Specimens",
    href: "/specimens",
    description: "Collection to completion",
    icon: TestTube2,
    allowedRoles: ["admin", "intake", "technician", "reviewer"],
  },
  {
    title: "Results",
    href: "/results",
    description: "Draft, review, release",
    icon: FileCheck2,
    allowedRoles: ["admin", "technician", "reviewer"],
  },
  {
    title: "Reports",
    href: "/reports",
    description: "PDF and structured exports",
    icon: FileOutput,
    allowedRoles: ["admin", "reviewer"],
  },
  {
    title: "Admin",
    href: "/admin",
    description: "Catalog, users, roles",
    icon: Settings2,
    allowedRoles: ["admin"],
  },
  {
    title: "Analytics",
    href: "/analytics",
    description: "KPIs and trend analysis",
    icon: BarChart3,
    allowedRoles: ["admin"],
  },
  {
    title: "Integrations",
    href: "/integrations",
    description: "EMR & data exchange",
    icon: Cable,
    allowedRoles: ["admin"],
  },
];
