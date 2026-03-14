import { z } from "zod";

export const createPatientSchema = z.object({
  full_name: z.string().min(1, "Full name is required.").max(150, "Name is too long."),
  date_of_birth: z.string().optional(),
  gender: z.enum(["male", "female", "other", ""]).optional(),
  phone: z.string().max(20, "Phone number is too long.").optional(),
  email: z.string().email("Enter a valid email.").or(z.literal("")).optional(),
});

export const updatePatientSchema = createPatientSchema.extend({
  id: z.string().uuid("Invalid patient ID."),
});
