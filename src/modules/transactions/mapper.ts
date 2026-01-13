import { Money } from "@/domain/money";
import { Transaction } from "./domain";
import type { CreateTransactionRequest, TransactionResponse } from "./dto";

export function toDomain(dto: CreateTransactionRequest): Transaction {
  const transactionId = dto.id ?? crypto.randomUUID();

  const entries = dto.entries.map((entryDto) => ({
    id: entryDto.id ?? crypto.randomUUID(),
    accountId: entryDto.account_id,
    direction: entryDto.direction,
    amount: Money.fromNumber(entryDto.amount),
  }));

  return new Transaction(transactionId, dto.name ?? null, entries);
}

export function toResponse(transaction: Transaction): TransactionResponse {
  return {
    id: transaction.id,
    name: transaction.name,
    entries: transaction.entries.map((entry) => ({
      id: entry.id,
      direction: entry.direction,
      account_id: entry.accountId,
      amount: entry.amount.toNumber(),
    })),
  };
}
