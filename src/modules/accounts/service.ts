import { Money } from "@/domain/money";
import type { AccountRepository } from "./repository";
import type { TransactionRepository } from "../transactions/repository";
import type { CreateAccountRequest, AccountResponse } from "./dto";
import * as mapper from "./mapper";
import { AccountNotFoundError } from "@/domain/errors";

export class AccountService {
  constructor(
    private readonly accountRepo: AccountRepository,
    private readonly transactionRepo: TransactionRepository
  ) {}

  createAccount(dto: CreateAccountRequest): AccountResponse {
    // TODO evaluate if it makes sense to transform directly in the DTO in ZOD. it can validate and treat the data.
    const account = mapper.toDomain(dto);

    this.accountRepo.save(account);

    const accountWithBalance = {
      ...account,
      balance: Money.fromNumber(0),
    };

    return mapper.toResponse(accountWithBalance);
  }

  getAccount(id: string): AccountResponse | null {
    const account = this.accountRepo.getById(id);

    // TODO
    // Throw is an unexpected comportment in V8, we could return a custom error object.
    // Since this is a critical part of the application, throwing could de-optimize the code.
    // Node optimization requires the function to always return a value. Igntion JIT has TurboFan, which makes node faster.
    // Look at maglev, sparkplug and TurboFan, which will analyze the code during runtime and generate a binary to make it faster.
    if (!account) {
      throw new AccountNotFoundError(id);
    }

    const balance = this.calculateBalance(account.id, account.direction);

    return mapper.toResponse({ ...account, balance });
  }

  listAccounts(): AccountResponse[] {
    return this.accountRepo.findAll().map((account) => {
      const balance = this.calculateBalance(account.id, account.direction);
      return mapper.toResponse({ ...account, balance });
    });
  }

  // Using iterator helpers for immutable, functional balance calculation
  // https://v8.dev/features/iterator-helpers
  private calculateBalance(
    accountId: string,
    accountDirection: "debit" | "credit"
  ): Money {
    const entries = this.transactionRepo.getEntriesForAccount(accountId);

    const balanceCents = entries
      .values()
      .map((entry) => {
        // Same direction adds to balance, opposite direction subtracts
        const cents = entry.amount.getCents();
        return entry.direction === accountDirection ? cents : -cents;
      })
      .reduce((total, cents) => total + cents, 0);

    return Money.fromCents(balanceCents);
  }
}
