import type { TransactionRepository } from "./repository";
import type { AccountRepository } from "../accounts/repository";
import type { CreateTransactionRequest, TransactionResponse } from "./dto";
import * as mapper from "./mapper";
import {
  AccountNotFoundError,
  UnbalancedTransactionError,
  TransactionNotFoundError,
  DuplicateTransactionError,
} from "@/domain/errors";
import {
  idempotencyCaches,
  getCached,
  setCached,
} from "../../shared/idempotency-cache";

export class TransactionService {
  constructor(
    private readonly transactionRepo: TransactionRepository,
    private readonly accountRepo: AccountRepository
  ) {}

  createTransaction(dto: CreateTransactionRequest): TransactionResponse {
    // Idempotency check: Create a normalized version of the DTO for hashing
    // Exclude the optional 'id' field if provided, as we want to detect duplicate transaction data
    const idempotencyData = {
      name: dto.name,
      entries: dto.entries.map((entry) => ({
        account_id: entry.account_id,
        direction: entry.direction,
        amount: entry.amount,
      })),
    };

    // Check if this exact transaction has been processed recently (within last 15 minutes)
    const cachedTransactionId = getCached<string>(
      idempotencyCaches.transactions,
      idempotencyData
    );
    if (cachedTransactionId) {
      throw new DuplicateTransactionError(cachedTransactionId);
    }

    const transaction = mapper.toDomain(dto);

    for (const entry of transaction.entries) {
      const account = this.accountRepo.getById(entry.accountId);
      if (!account) {
        throw new AccountNotFoundError(entry.accountId);
      }
    }

    this.transactionRepo.save(transaction);

    // Cache the transaction ID to prevent duplicates
    setCached(idempotencyCaches.transactions, idempotencyData, transaction.id);

    return mapper.toResponse(transaction);
  }

  getTransaction(id: string): TransactionResponse | null {
    const transaction = this.transactionRepo.getById(id);

    if (!transaction) {
      throw new TransactionNotFoundError(id);
    }
    return mapper.toResponse(transaction);
  }

  listTransactions(): TransactionResponse[] {
    return this.transactionRepo.findAll().map(mapper.toResponse);
  }
}
