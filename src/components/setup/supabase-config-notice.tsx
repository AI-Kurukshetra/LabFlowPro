import { FlaskConical, ShieldAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type SupabaseConfigNoticeProps = {
  className?: string;
};

export function SupabaseConfigNotice({
  className,
}: SupabaseConfigNoticeProps) {
  return (
    <div
      className={cn(
        "rounded-[1.9rem] border border-amber-200/70 bg-[linear-gradient(135deg,rgba(255,249,235,0.94),rgba(255,255,255,0.9))] p-5 shadow-[0_26px_80px_-52px_rgba(15,23,42,0.32)] backdrop-blur-xl",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 rounded-2xl bg-amber-500/10 p-2 text-amber-700">
          <ShieldAlert className="size-4" />
        </span>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[1rem] font-semibold text-slate-950">
              Supabase is not connected yet
            </p>
            <Badge variant="secondary">Preview mode</Badge>
          </div>
          <p className="text-[0.95rem] leading-7 text-slate-600">
            Add the public Supabase connection values to <code>.env.local</code>{" "}
            to turn on real authentication and route protection.
          </p>
          <div className="flex flex-wrap gap-2">
            <code className="rounded-full border border-amber-200 bg-white px-3 py-1 text-[0.78rem] text-slate-700">
              NEXT_PUBLIC_SUPABASE_URL
            </code>
            <code className="rounded-full border border-amber-200 bg-white px-3 py-1 text-[0.78rem] text-slate-700">
              NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
            </code>
            <code className="rounded-full border border-amber-200 bg-white px-3 py-1 text-[0.78rem] text-slate-700">
              NEXT_PUBLIC_APP_URL
            </code>
          </div>
          <div className="flex items-start gap-2 text-[0.92rem] text-slate-600">
            <FlaskConical className="mt-0.5 size-4 shrink-0 text-amber-700" />
            The workspace still renders so the product shell can be reviewed
            before the live schema and policies are wired.
          </div>
        </div>
      </div>
    </div>
  );
}
