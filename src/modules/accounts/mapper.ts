import { Money } from "@/domain/money";
import type { Account, AccountWithBalance } from "./domain";
import type { AccountResponse, CreateAccountRequest } from "./dto";

export function toDomain(dto: CreateAccountRequest): Account {
  return {
    id: dto.id ?? crypto.randomUUID(),
    name: dto.name ?? null,
    direction: dto.direction,
  };
}

export function toResponse(account: AccountWithBalance): AccountResponse {
  return {
    id: account.id,
    name: account.name,
    direction: account.direction,
    balance: account.balance.toNumber(),
  };
}
