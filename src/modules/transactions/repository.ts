import type { Transaction, Entry } from "./domain";

export interface TransactionRepository {
  getById(id: string): Transaction | undefined;
  findAll(): Transaction[];
  save(transaction: Transaction): void;
  getEntriesForAccount(accountId: string): Entry[];
}
