import { Money } from "@/domain/money";
import { Direction } from "@/domain/direction";
import {
  UnbalancedTransactionError,
  EmptyTransactionError,
} from "@/domain/errors";

export interface Entry {
  id: string;
  accountId: string;
  direction: Direction;
  amount: Money;
}

export class Transaction {
  constructor(
    readonly id: string,
    readonly name: string | null,
    readonly entries: ReadonlyArray<Entry>
  ) {
    if (entries.length === 0) {
      throw new EmptyTransactionError();
    }

    if (!this.isBalanced()) {
      throw new UnbalancedTransactionError();
    }
  }

  private isBalanced(): boolean {
    // In double-entry bookkeeping, the sum of all signed entries should be zero
    // Debits are positive, credits are negative (or vice versa - the sign doesn't matter)
    const balanceSum = this.entries
      .values()
      .map((entry) => {
        const cents = entry.amount.getCents();
        return entry.direction === "debit" ? cents : -cents;
      })
      .reduce((sum, cents) => sum + cents, 0);

    return balanceSum === 0;
  }
}
