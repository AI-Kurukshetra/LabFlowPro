import { FlaskConical } from "lucide-react";

import { cn } from "@/lib/utils";

type LogoMarkProps = {
  compact?: boolean;
  inverted?: boolean;
  className?: string;
};

export function LogoMark({
  compact = false,
  inverted = false,
  className,
}: LogoMarkProps) {
  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "flex size-9 items-center justify-center rounded-lg",
          inverted
            ? "bg-teal-400 text-slate-950"
            : "bg-teal-600 text-white"
        )}
      >
        <FlaskConical className="size-[1.1rem]" />
      </span>
      <span
        className={cn(
          "text-[0.95rem] font-bold tracking-tight",
          inverted ? "text-white" : "text-slate-950"
        )}
      >
        LabFlow Pro
      </span>
    </div>
  );
}
