import { describe, it, expect } from "vitest";
import { hashKey } from "./hashKey";
import { randomUUID } from "node:crypto";

describe("hashKey", () => {
   it("should generate the same hash for the same object regardless of key order", () => {
      const transaction1 = {
         name: "transaction-1-name",
         entries: [
            {
               account_id: "account-1-id",
               direction: "credit",
               amount: 100,
            },
            {
               account_id: "account-2-id",
               direction: "debit",
               amount: 100,
            }
         ]
      }
      const transaction2 = {
         entries: [
            {
               account_id: "account-1-id",
               direction: "credit",
               amount: 100,
            },
            {
               account_id: "account-2-id",
               direction: "debit",
               amount: 100,
            }
         ],
         name: "transaction-1-name",
      }

      const hash1 = hashKey(transaction1);
      const hash2 = hashKey(transaction2);
      expect(hash1).toBe(hash2);
   })

   it("should generate different hashes for different objects", () => {
      const account1Id = randomUUID()
      const account2Id = randomUUID()
      const transaction1 = {
         name: "",
         entries: [
            {
               account_id: account1Id,
               direction: "credit",
               amount: 100,
            },
            {
               account_id: account2Id,
               direction: "debit",
               amount: 100,
            }
         ]
      };
      const transaction2 = {
         name: "",
         entries: [
            {
               account_id: account1Id,
               direction: "debit",
               amount: 10,
            },
            {
               account_id: account2Id,
               direction: "credit",
               amount: 10,
            },
         ]
      };

      const hash1 = hashKey(transaction1);
      const hash2 = hashKey(transaction2);
      expect(hash1).not.toBe(hash2);
   })
})