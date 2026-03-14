import { CheckCircle2, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ModulePageData } from "@/lib/mock-data";
import { DataTableCard } from "@/components/workspace/data-table-card";
import { MetricCard } from "@/components/workspace/metric-card";

type ModulePageProps = {
  data: ModulePageData;
};

export function ModulePage({ data }: ModulePageProps) {
  const leadNotes = data.notes.slice(0, 2);

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-5">
            <Badge variant="secondary">{data.status}</Badge>
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Module overview
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950">
                {data.title}
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-slate-600">
                {data.description}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-slate-950 p-6 text-white">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-teal-300">
            <ShieldCheck className="size-4" />
            Key capabilities
          </div>
          <p className="mt-4 text-2xl font-bold tracking-tight text-white">
            Built for speed, accuracy, and traceability.
          </p>
          <div className="mt-6 space-y-4">
            {leadNotes.map((note) => (
              <div
                key={note}
                className="rounded-lg border border-white/10 bg-white/5 p-4"
              >
                <p className="text-sm leading-relaxed text-slate-200">{note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <DataTableCard
          title={`${data.title} overview`}
          description="Recent activity and current status across this module."
          columns={data.columns}
          rows={data.rows}
        />

        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              How it works
            </p>
            <CardTitle className="text-lg tracking-tight text-slate-950">
              Workflow details
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed text-slate-600">
              Key behaviors and rules that keep this module reliable and consistent.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.notes.map((note) => (
              <div key={note} className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" />
                <p className="text-sm leading-relaxed text-slate-600">{note}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
