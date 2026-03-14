import { z } from "zod";

export const createSpecimenSchema = z.object({
  specimen_ref: z.string().min(1, "Specimen reference is required."),
  order_id: z.string().uuid("Select an order."),
  type: z.enum(["serum", "plasma", "whole_blood", "urine", "csf", "other"], { message: "Select a specimen type." }),
  collector: z.string().max(100).optional(),
  barcode: z.string().max(50, "Barcode is too long.").optional(),
  notes: z.string().max(500, "Notes are too long.").optional(),
});

export const updateSpecimenStatusSchema = z.object({
  id: z.string().uuid("Invalid specimen ID."),
  status: z.enum(["received", "processing", "completed", "rejected"], { message: "Invalid status." }),
  rejection_reason: z.string().max(300).optional(),
}).refine((data) => {
  if (data.status === "rejected" && (!data.rejection_reason || data.rejection_reason.trim() === "")) {
    return false;
  }
  return true;
}, {
  message: "Rejection reason is required.",
  path: ["rejection_reason"],
});
