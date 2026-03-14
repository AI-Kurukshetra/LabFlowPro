import { z } from "zod";

export const createOrderSchema = z.object({
  patient_id: z.string().uuid("Select a patient."),
  panel_id: z.string().uuid("Select a panel.").or(z.literal("")).optional(),
  priority: z.enum(["routine", "urgent", "stat"], { message: "Select a valid priority." }),
  notes: z.string().max(500, "Notes are too long.").optional(),
});
