import { Hono } from "hono";
import type { AccountService } from "./service";
import { createAccountRequestSchema } from "./dto";
import { validateJson } from "../../shared/validation";

export function createAccountsRouter(service: AccountService) {
  const app = new Hono();

  // Quality of life for ease of testing
  app.get("/", (c) => {
    const results = service.listAccounts();
    return c.json(results);
  });

  app.post("/", validateJson(createAccountRequestSchema), (c) => {
    const dto = c.req.valid("json");
    const result = service.createAccount(dto);
    return c.json(result, 201);
  });

  app.get("/:id", async (c) => {
    const id = c.req.param("id");
    const result = service.getAccount(id);

    return c.json(result);
  });

  return app;
}
