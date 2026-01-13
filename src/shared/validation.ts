import { zValidator } from "@hono/zod-validator";
import type { ZodSchema } from "zod";
import type { Context } from "hono";

export function validateJson<T>(schema: ZodSchema<T>) {
  return zValidator("json", schema, (result, c: Context) => {
    if (!result.success) {
      return c.json(
        {
          error: "Validation failed",
          details: result.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        400
      );
    }
  });
}
