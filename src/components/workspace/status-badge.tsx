import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusColorMap: Record<string, string> = {
  received: "bg-sky-100 text-sky-700 border-sky-200",
  draft: "bg-sky-100 text-sky-700 border-sky-200",
  routine: "bg-sky-100 text-sky-700 border-sky-200",
  queued: "bg-sky-100 text-sky-700 border-sky-200",

  processing: "bg-amber-100 text-amber-700 border-amber-200",
  in_process: "bg-amber-100 text-amber-700 border-amber-200",
  review: "bg-violet-100 text-violet-700 border-violet-200",
  urgent: "bg-amber-100 text-amber-700 border-amber-200",
  formatting: "bg-amber-100 text-amber-700 border-amber-200",

  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  released: "bg-emerald-100 text-emerald-700 border-emerald-200",
  release_ready: "bg-emerald-100 text-emerald-700 border-emerald-200",
  collected: "bg-emerald-100 text-emerald-700 border-emerald-200",

  rejected: "bg-red-100 text-red-700 border-red-200",
  returned: "bg-red-100 text-red-700 border-red-200",
  stat: "bg-red-100 text-red-700 border-red-200",

  active: "bg-green-100 text-green-700 border-green-200",
  invited: "bg-sky-100 text-sky-700 border-sky-200",

  deactivated: "bg-gray-100 text-gray-500 border-gray-200",
  inactive: "bg-gray-100 text-gray-500 border-gray-200",
  merged: "bg-gray-100 text-gray-500 border-gray-200",

  admin: "bg-violet-100 text-violet-700 border-violet-200",
  intake: "bg-sky-100 text-sky-700 border-sky-200",
  technician: "bg-amber-100 text-amber-700 border-amber-200",
  reviewer: "bg-emerald-100 text-emerald-700 border-emerald-200",
  patient: "bg-gray-100 text-gray-600 border-gray-200",
};

function formatLabel(status: string): string {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

type StatusBadgeProps = {
  status: string;
  className?: string;
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const colors = statusColorMap[status.toLowerCase()] ?? "bg-gray-100 text-gray-600 border-gray-200";

  return (
    <Badge
      variant="outline"
      className={cn(colors, className)}
    >
      {formatLabel(status)}
    </Badge>
  );
}
