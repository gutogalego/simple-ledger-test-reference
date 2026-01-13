import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { DomainError } from "../../domain/errors";

/**
 * Global error handler middleware for Hono
 * Catches all errors thrown in the application and formats them consistently
 */
export const errorHandler = (err: Error, c: Context) => {
  // Handle Hono's built-in HTTP exceptions
  if (err instanceof HTTPException) {
    return c.json(
      {
        status: "error",
        message: err.message,
      },
      err.status
    );
  }

  // Handle custom domain errors
  if (err instanceof DomainError) {
    const response = {
      status: "error" as const,
      message: err.message,
      type: err.name,
    };

    return c.json(response, err.statusCode as any);
  }

  // Handle validation errors from Zod (via @hono/zod-validator)
  if (err.name === "ZodError") {
    return c.json(
      {
        status: "error",
        message: "Validation failed",
        errors: (err as any).errors,
      },
      400
    );
  }

  // Log unexpected errors for debugging
  console.error("Unexpected error:", {
    name: err.name,
    message: err.message,
    stack: err.stack,
  });

  // Return generic error response for unexpected errors
  return c.json(
    {
      status: "error",
      message: "Internal server error",
    },
    500
  );
};
