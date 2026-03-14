import { z } from "zod";

export const generateReportSchema = z.object({
  order_id: z.string().uuid("Select an order."),
  format: z.enum(["pdf", "pdf_csv", "pdf_json"], { message: "Select a report format." }),
});

export const updateReportStatusSchema = z.object({
  id: z.string().uuid("Invalid report ID."),
  status: z.enum(["queued", "formatting", "release_ready", "released"], { message: "Invalid status." }),
});

export const reportIdSchema = z.object({
  id: z.string().uuid("Invalid report ID."),
});
