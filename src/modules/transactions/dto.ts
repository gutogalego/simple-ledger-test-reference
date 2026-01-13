import { z } from "zod";
import { directionSchema } from "@/domain/direction.js";

const entryRequestSchema = z.object({
  id: z.uuidv4().optional(),
  direction: directionSchema,
  account_id: z.uuidv4(),
  amount: z.number().positive(),
});

const entryResponseSchema = z.object({
  id: z.uuidv4(),
  direction: directionSchema,
  account_id: z.uuidv4(),
  amount: z.number().positive(),
});

export const createTransactionRequestSchema = z.object({
  id: z.uuidv4().optional(),
  name: z.string().optional(),
  entries: z.array(entryRequestSchema).nonempty(),
});

export const transactionResponseSchema = z.object({
  id: z.uuidv4(),
  name: z.string().nullable(),
  entries: z.array(entryResponseSchema).nonempty(),
});

export type CreateTransactionRequest = z.infer<
  typeof createTransactionRequestSchema
>;
export type TransactionResponse = z.infer<typeof transactionResponseSchema>;
export type EntryRequest = z.infer<typeof entryRequestSchema>;
export type EntryResponse = z.infer<typeof entryResponseSchema>;
