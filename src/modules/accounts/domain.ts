import type { Money } from "@/domain/money";
import type { Direction } from "@/domain/direction";

export interface Account {
  id: string;
  name: string | null;
  direction: Direction;
}

export interface AccountWithBalance extends Account {
  balance: Money;
}
