import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  FileCheck2,
  FileOutput,
  Heart,
  Lightbulb,
  MessageCircle,
  TestTube2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getPatientProfile, getPatientDashboardMetrics } from "@/lib/queries/portal";

const quickLinks = [
  {
    title: "View Results",
    description: "Check your released laboratory test results",
    href: "/portal/results",
    icon: TestTube2,
    iconBg: "bg-teal-50 text-teal-600",
  },
  {
    title: "View Reports",
    description: "Download your lab reports and exports",
    href: "/portal/reports",
    icon: FileOutput,
    iconBg: "bg-sky-50 text-sky-600",
  },
  {
    title: "Chat with AI Assistant",
    description: "Ask questions about your lab results",
    href: "/portal/chat",
    icon: MessageCircle,
    iconBg: "bg-violet-50 text-violet-600",
  },
];

const healthTips = [
  "Stay hydrated before a blood draw — it makes the process easier.",
  "Bring a list of your current medications to every lab visit.",
  "Ask your doctor to explain any out-of-range values in context.",
  "Fasting means no food or drink (except water) for 8-12 hours before the test.",
];

export default async function PortalDashboardPage() {
  const supabase = await createServerSupabaseClient();
  const profile = await getPatientProfile(supabase);
  const patient = profile.patients!;

  const firstName = patient.full_name.split(" ")[0];

  let metrics = { releasedResults: 0, releasedReports: 0, lastResultDate: null as string | null };
  try {
    metrics = await getPatientDashboardMetrics(supabase, patient.id);
  } catch {
    // Use default metrics if query fails
  }

  const lastUpdatedDisplay = metrics.lastResultDate
    ? new Date(metrics.lastResultDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "No results yet";

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div className="rounded-xl bg-slate-950 p-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">
            Welcome back, {firstName}
          </h1>
          <Badge
            variant="outline"
            className="bg-teal-500/10 text-teal-400 border-teal-500/20"
          >
            {patient.patient_ref}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-slate-400">
          Here is an overview of your laboratory information.
        </p>
      </div>

      {/* Metric cards */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          Overview
        </p>
        <div className="mt-3 grid gap-4 grid-cols-1 sm:grid-cols-3">
          <Card className="border border-slate-200 rounded-xl shadow-sm">
            <CardContent className="space-y-2 p-5">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                  <FileCheck2 className="size-5" />
                </span>
                <p className="text-sm font-medium text-slate-500">Released Results</p>
              </div>
              <p className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                {metrics.releasedResults}
              </p>
              <p className="text-xs text-slate-400">Test results available to view</p>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 rounded-xl shadow-sm">
            <CardContent className="space-y-2 p-5">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                  <FileOutput className="size-5" />
                </span>
                <p className="text-sm font-medium text-slate-500">Reports Available</p>
              </div>
              <p className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                {metrics.releasedReports}
              </p>
              <p className="text-xs text-slate-400">Lab reports ready for download</p>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 rounded-xl shadow-sm">
            <CardContent className="space-y-2 p-5">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <CalendarDays className="size-5" />
                </span>
                <p className="text-sm font-medium text-slate-500">Last Updated</p>
              </div>
              <p className="text-xl font-bold tracking-tight text-slate-950">
                {lastUpdatedDisplay}
              </p>
              <p className="text-xs text-slate-400">Most recent result release</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick links */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          Quick links
        </p>
        <div className="mt-3 grid gap-4 grid-cols-1 sm:grid-cols-3">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href} className="group">
                <Card className="h-full border border-slate-200 rounded-xl shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
                  <CardContent className="flex items-start gap-4 p-5">
                    <span className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${link.iconBg}`}>
                      <Icon className="size-5" />
                    </span>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-slate-950">
                        {link.title}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {link.description}
                      </p>
                    </div>
                    <ArrowRight className="mt-0.5 size-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Health tips */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          Health tips
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {healthTips.map((tip) => (
            <Card key={tip} className="border border-slate-200 rounded-xl shadow-sm">
              <CardContent className="flex items-start gap-3 p-5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <Lightbulb className="size-4" />
                </span>
                <p className="text-sm leading-relaxed text-slate-600">{tip}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Health info card */}
      <Card className="border border-teal-100 bg-teal-50/50 rounded-xl shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-600">
              <Heart className="size-5" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-slate-950">
                Understanding your lab results
              </h3>
              <div className="mt-2 space-y-2 text-sm text-slate-600">
                <p>
                  Lab results show how your body is functioning. Each test
                  measures a specific substance in your blood or other sample.
                  Your results are compared to a reference range, which
                  represents typical values for healthy individuals.
                </p>
                <p>
                  Values within the reference range are marked as{" "}
                  <span className="font-medium text-emerald-700">Normal</span>.
                  Values outside the range are flagged as{" "}
                  <span className="font-medium text-red-600">Out of range</span>
                  , which does not always mean something is wrong — your
                  healthcare provider can explain what your specific results mean
                  for you.
                </p>
                <p>
                  If you have questions, use our{" "}
                  <Link
                    href="/portal/chat"
                    className="font-medium text-teal-700 underline underline-offset-2 hover:text-teal-800"
                  >
                    AI chat assistant
                  </Link>{" "}
                  for general guidance, or contact your healthcare provider for
                  personalized advice.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
