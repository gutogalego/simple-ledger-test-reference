export class Money {
  private constructor(
    private readonly cents: number,
    private readonly currency: "USD" = "USD"
  ) {
    if (!Number.isInteger(cents)) {
      throw new Error("Money cents must be an integer");
    }
  }

  static fromNumber(amount: number, currency: "USD" = "USD"): Money {
    if (!Number.isFinite(amount)) {
      throw new Error("Invalid monetary amount: not finite");
    }

    // enforce at most 2 decimal places.
    // Note: on an actual production system, we would use a more precise currency format. Either decimal (19,4) or integer/micros.
    // The error margin is 1e-7 to account for floating point precision issues.
    // On actual production we might do bankers rounding to deal with such imprecisions.

    // TODO: JSdoc can be a good idea. On everything that is global.

    const cents = Math.round(amount * 100);

    if (Math.abs(cents / 100 - amount) > 1e-9) {
      throw new Error("Amount must have at most 2 decimal places");
    }

    return new Money(cents, currency);
  }

  static fromCents(cents: number, currency: "USD" = "USD"): Money {
    return new Money(cents, currency);
  }

  toNumber(): number {
    return this.cents / 100;
  }

  getCents(): number {
    return this.cents;
  }

  getCurrency(): "USD" {
    return this.currency;
  }

  plus(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.cents + other.cents, this.currency);
  }

  minus(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.cents - other.cents, this.currency);
  }

  equals(other: Money): boolean {
    return this.currency === other.currency && this.cents === other.cents;
  }

  private assertSameCurrency(other: Money) {
    if (this.currency !== other.currency) {
      throw new Error("Currency mismatch");
    }
  }
}
