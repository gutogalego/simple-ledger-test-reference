import { z } from "zod";
import { directionSchema } from "@/domain/direction.js";

export const createAccountRequestSchema = z.object({
  id: z.uuidv4().optional(),
  name: z.string().optional(),
  direction: directionSchema,
});

export const accountResponseSchema = z.object({
  id: z.uuidv4(),
  name: z.string().nullable(),
  direction: directionSchema,
  balance: z.number(),
});

export type CreateAccountRequest = z.infer<typeof createAccountRequestSchema>;
export type AccountResponse = z.infer<typeof accountResponseSchema>;
