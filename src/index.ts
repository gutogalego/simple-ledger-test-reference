import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { secureHeaders } from "hono/secure-headers";
import { readFile } from "node:fs/promises";
import { SQLiteDatabase } from "./infra/sqlite-db";
import { AccountService } from "./modules/accounts/service";
import { TransactionService } from "./modules/transactions/service";
import { createAccountsRouter } from "./modules/accounts/http";
import { createTransactionsRouter } from "./modules/transactions/http";
import { errorHandler } from "./shared/middlewares/error-handler";

const PORT = 3000;

const app = new Hono();

const db = new SQLiteDatabase("./ledger_v2.db");
const accountService = new AccountService(db.accounts, db.transactions);
const transactionService = new TransactionService(db.transactions, db.accounts);

app.get("/", async (c) => {
  const html = await readFile("./public/index.html", "utf-8");
  return c.html(html);
});

app.use("*", secureHeaders());

app.route("/accounts", createAccountsRouter(accountService));
app.route("/transactions", createTransactionsRouter(transactionService));

app.onError(errorHandler);

serve(
  {
    fetch: app.fetch,
    port: PORT,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);
