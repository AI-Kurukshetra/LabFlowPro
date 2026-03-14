"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ExportFormat } from "@/lib/emr/types";

type ExportButtonsProps = {
  baseUrl: string;
  formats: ExportFormat[];
};

const formatLabels: Record<ExportFormat, string> = {
  csv: "CSV",
  json: "JSON",
  fhir: "FHIR R4",
};

export function ExportButtons({ baseUrl, formats }: ExportButtonsProps) {
  const separator = baseUrl.includes("?") ? "&" : "?";

  return (
    <div className="flex items-center gap-2">
      <Download className="size-4 text-slate-400" />
      {formats.map((format) => (
        <Button
          key={format}
          variant="outline"
          size="xs"
          asChild
        >
          <a href={`${baseUrl}${separator}format=${format}`}>
            {formatLabels[format]}
          </a>
        </Button>
      ))}
    </div>
  );
}
