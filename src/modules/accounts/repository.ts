import type { Account } from "./domain";

export interface AccountRepository {
  getById(id: string): Account | undefined;
  findAll(): Account[];
  save(account: Account): void;
}
