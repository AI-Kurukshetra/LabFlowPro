import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { MetricCardData } from "@/lib/mock-data";

type MetricCardProps = {
  metric: MetricCardData;
  accentColor?: string;
  icon?: LucideIcon;
  href?: string;
};

export function MetricCard({ metric, accentColor, icon: Icon, href }: MetricCardProps) {
  const DisplayIcon = Icon ?? ArrowUpRight;

  const content = (
    <Card className={cn(
      "border border-slate-200/80 bg-white shadow-sm transition-colors",
      accentColor && "border-t-2",
      accentColor,
      href && "cursor-pointer hover:border-slate-300 hover:bg-slate-50/50",
    )}>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">
              {metric.label}
            </p>
            <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {metric.value}
            </p>
          </div>
          <span className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-500",
            href ? "bg-slate-100 group-hover:bg-teal-50 group-hover:text-teal-600" : "bg-slate-100",
          )}>
            <DisplayIcon className="size-4" />
          </span>
        </div>

        <p className="text-xs text-slate-400">
          {metric.helper}
        </p>
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="group">
        {content}
      </Link>
    );
  }

  return content;
}
