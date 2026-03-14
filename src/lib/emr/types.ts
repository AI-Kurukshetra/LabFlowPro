export type ExportFormat = "csv" | "json" | "fhir";

export type ExportType = "results" | "orders" | "patient";

export type ExportRecord = {
  id: string;
  type: ExportType;
  format: ExportFormat;
  recordCount: number;
  exportedAt: string;
  exportedBy: string | null;
  filename: string;
};
