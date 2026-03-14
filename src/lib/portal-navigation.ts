import type { LucideIcon } from "lucide-react";
import {
  FileCheck2,
  FileOutput,
  LayoutDashboard,
  MessageCircle,
} from "lucide-react";

export type PortalNavItem = {
  title: string;
  href: string;
  description: string;
  icon: LucideIcon;
};

export const portalNavItems: PortalNavItem[] = [
  { title: "Dashboard", href: "/portal", description: "Your health overview", icon: LayoutDashboard },
  { title: "My Results", href: "/portal/results", description: "View lab test results", icon: FileCheck2 },
  { title: "My Reports", href: "/portal/reports", description: "Download released reports", icon: FileOutput },
  { title: "AI Assistant", href: "/portal/chat", description: "Ask about your results", icon: MessageCircle },
];
