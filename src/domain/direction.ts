import { z } from "zod";

export const directionSchema = z.enum(["debit", "credit"]);

export type Direction = z.infer<typeof directionSchema>;
