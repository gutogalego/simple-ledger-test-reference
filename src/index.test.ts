import { describe, it, expect, beforeEach } from "vitest";
import { Hono } from "hono";
import { AccountService } from "./modules/accounts/service";
import { TransactionService } from "./modules/transactions/service";
import { createAccountsRouter } from "./modules/accounts/http";
import { createTransactionsRouter } from "./modules/transactions/http";
import { errorHandler } from "./shared/middlewares/error-handler";
import { idempotencyCaches } from "./shared/idempotency-cache";
import { SQLiteDatabase } from "infra/sqlite-db";

describe("API Integration Tests", () => {
  let app: Hono;
  let db: SQLiteDatabase;

  beforeEach(() => {
    app = new Hono();
    db = new SQLiteDatabase(":memory:");

    // Clear idempotency cache between tests
    idempotencyCaches.transactions.flushAll();

    const accountService = new AccountService(db.accounts, db.transactions);
    const transactionService = new TransactionService(
      db.transactions,
      db.accounts
    );

    app.route("/accounts", createAccountsRouter(accountService));
    app.route("/transactions", createTransactionsRouter(transactionService));

    // Register error handler
    app.onError(errorHandler);
  });

  describe("POST /accounts", () => {
    it("should create a debit account with zero balance", async () => {
      const res = await app.request("/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Cash",
          direction: "debit",
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data).toMatchObject({
        name: "Cash",
        direction: "debit",
        balance: 0,
      });
      expect(data.id).toBeDefined();
    });

    it("should create a credit account with zero balance", async () => {
      const res = await app.request("/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Revenue",
          direction: "credit",
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data).toMatchObject({
        name: "Revenue",
        direction: "credit",
        balance: 0,
      });
    });

    it("should accept custom UUID for account", async () => {
      const customId = "71cde2aa-b9bc-496a-a6f1-34964d05e6fd";
      const res = await app.request("/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: customId,
          name: "Test",
          direction: "debit",
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.id).toBe(customId);
    });
  });

  describe("GET /accounts/:id", () => {
    it("should retrieve an existing account", async () => {
      const createRes = await app.request("/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Cash",
          direction: "debit",
        }),
      });
      const created = await createRes.json();

      const getRes = await app.request(`/accounts/${created.id}`);
      expect(getRes.status).toBe(200);
      const data = await getRes.json();
      expect(data).toMatchObject(created);
    });

    it("should return 404 for non-existent account", async () => {
      const res = await app.request(
        "/accounts/00000000-0000-0000-0000-000000000000"
      );
      expect(res.status).toBe(404);
    });
  });

  describe("GET /accounts", () => {
    it("should list all accounts", async () => {
      await app.request("/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Account 1", direction: "debit" }),
      });
      await app.request("/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Account 2", direction: "credit" }),
      });

      const res = await app.request("/accounts");
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(2);
    });
  });

  describe("POST /transactions", () => {
    it("should create a balanced transaction and update account balances", async () => {
      const acc1 = await app.request("/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Cash", direction: "debit" }),
      });
      const account1 = await acc1.json();

      const acc2 = await app.request("/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Revenue", direction: "credit" }),
      });
      const account2 = await acc2.json();

      const txRes = await app.request("/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Deposit",
          entries: [
            {
              direction: "debit",
              account_id: account1.id,
              amount: 100,
            },
            {
              direction: "credit",
              account_id: account2.id,
              amount: 100,
            },
          ],
        }),
      });

      expect(txRes.status).toBe(201);
      const tx = await txRes.json();
      expect(tx.entries.length).toBe(2);
      expect(tx.entries[0].id).toBeDefined();
      expect(tx.entries[1].id).toBeDefined();

      const acc1Check = await app.request(`/accounts/${account1.id}`);
      const acc1Data = await acc1Check.json();
      expect(acc1Data.balance).toBe(100);

      const acc2Check = await app.request(`/accounts/${account2.id}`);
      const acc2Data = await acc2Check.json();
      expect(acc2Data.balance).toBe(100);
    });

    it("should reject unbalanced transaction", async () => {
      const acc1 = await app.request("/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Cash", direction: "debit" }),
      });
      const account1 = await acc1.json();

      const acc2 = await app.request("/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Revenue", direction: "credit" }),
      });
      const account2 = await acc2.json();

      const txRes = await app.request("/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries: [
            { direction: "debit", account_id: account1.id, amount: 100 },
            { direction: "credit", account_id: account2.id, amount: 50 },
          ],
        }),
      });

      expect(txRes.status).toBe(422);
      const error = await txRes.json();
      expect(error.message).toContain("balance");
    });

    it("should reject transaction with non-existent account", async () => {
      const acc1 = await app.request("/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Cash", direction: "debit" }),
      });
      const account1 = await acc1.json();

      const txRes = await app.request("/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries: [
            { direction: "debit", account_id: account1.id, amount: 100 },
            {
              direction: "credit",
              account_id: "a0000000-0000-4000-8000-000000000000",
              amount: 100,
            },
          ],
        }),
      });

      expect(txRes.status).toBe(404);
      const errorResponse = await txRes.json();
      expect(errorResponse.message).toContain("Account not found");
    });

    it("should handle complex multi-entry transactions", async () => {
      const acc1 = await (
        await app.request("/accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Cash", direction: "debit" }),
        })
      ).json();

      const acc2 = await (
        await app.request("/accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Revenue", direction: "credit" }),
        })
      ).json();

      const acc3 = await (
        await app.request("/accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Tax", direction: "credit" }),
        })
      ).json();

      const txRes = await app.request("/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Sale with tax",
          entries: [
            { direction: "debit", account_id: acc1.id, amount: 110 },
            { direction: "credit", account_id: acc2.id, amount: 100 },
            { direction: "credit", account_id: acc3.id, amount: 10 },
          ],
        }),
      });

      expect(txRes.status).toBe(201);

      const cashData = await (await app.request(`/accounts/${acc1.id}`)).json();
      const revenueData = await (
        await app.request(`/accounts/${acc2.id}`)
      ).json();
      const taxData = await (await app.request(`/accounts/${acc3.id}`)).json();

      expect(cashData.balance).toBe(110);
      expect(revenueData.balance).toBe(100);
      expect(taxData.balance).toBe(10);
    });
  });

  describe("GET /transactions", () => {
    it("should list all transactions", async () => {
      const acc1 = await (
        await app.request("/accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Cash", direction: "debit" }),
        })
      ).json();

      const acc2 = await (
        await app.request("/accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Revenue", direction: "credit" }),
        })
      ).json();

      await app.request("/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "TX1",
          entries: [
            { direction: "debit", account_id: acc1.id, amount: 100 },
            { direction: "credit", account_id: acc2.id, amount: 100 },
          ],
        }),
      });

      const res = await app.request("/transactions");
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(1);
      expect(data[0].name).toBe("TX1");
    });
  });

  describe("Double-Entry Rules", () => {
    it("should correctly apply debit entry to debit account (same direction)", async () => {
      const acc = await (
        await app.request("/accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Cash", direction: "debit" }),
        })
      ).json();

      const acc2 = await (
        await app.request("/accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Revenue", direction: "credit" }),
        })
      ).json();

      await app.request("/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries: [
            { direction: "debit", account_id: acc.id, amount: 100 },
            { direction: "credit", account_id: acc2.id, amount: 100 },
          ],
        }),
      });

      const accData = await (await app.request(`/accounts/${acc.id}`)).json();
      expect(accData.balance).toBe(100);
    });

    it("should correctly apply credit entry to debit account (different direction)", async () => {
      const acc = await (
        await app.request("/accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Cash", direction: "debit" }),
        })
      ).json();

      const acc2 = await (
        await app.request("/accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Expense", direction: "debit" }),
        })
      ).json();

      await app.request("/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries: [
            { direction: "credit", account_id: acc.id, amount: 50 },
            { direction: "debit", account_id: acc2.id, amount: 50 },
          ],
        }),
      });

      const accData = await (await app.request(`/accounts/${acc.id}`)).json();
      expect(accData.balance).toBe(-50);
    });
  });
});
