import { z } from "zod";

const resultEntrySchema = z.object({
  test_id: z.string().uuid(),
  value: z.string(),
  unit: z.string().optional(),
  is_abnormal: z.boolean().optional(),
});

export const saveResultsSchema = z.object({
  order_id: z.string().uuid("Invalid order ID."),
  results: z.array(resultEntrySchema).min(1, "At least one result is required."),
});

export const orderIdSchema = z.object({
  order_id: z.string().uuid("Invalid order ID."),
});
