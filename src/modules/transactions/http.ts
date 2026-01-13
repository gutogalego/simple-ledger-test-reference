import { Hono } from "hono";
import type { TransactionService } from "./service";
import { createTransactionRequestSchema } from "./dto";
import { TransactionNotFoundError } from "@/domain/errors";
import { validateJson } from "../../shared/validation";

export function createTransactionsRouter(service: TransactionService) {
  const app = new Hono();

  // Quality of life for ease of testing
  app.get("/", (c) => {
    const results = service.listTransactions();
    return c.json(results);
  });

  app.post("/", validateJson(createTransactionRequestSchema), async (c) => {
    const dto = c.req.valid("json");
    const result = service.createTransaction(dto);
    return c.json(result, 201);
  });

  app.get("/:id", async (c) => {
    const id = c.req.param("id");
    const result = service.getTransaction(id);

    if (!result) {
      throw new TransactionNotFoundError(id);
    }

    return c.json(result);
  });

  return app;
}
