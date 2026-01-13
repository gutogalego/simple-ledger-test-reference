import { describe, it, expect } from "vitest";
import { Money } from "./money";

describe("Money", () => {
  describe("fromNumber", () => {
    it("should create Money from valid number", () => {
      const money = Money.fromNumber(100.5);
      expect(money.toNumber()).toBe(100.5);
      expect(money.getCents()).toBe(10050);
    });

    it("should create Money from zero", () => {
      const money = Money.fromNumber(0);
      expect(money.toNumber()).toBe(0);
      expect(money.getCents()).toBe(0);
    });

    it("should create Money from negative number", () => {
      const money = Money.fromNumber(-50.25);
      expect(money.toNumber()).toBe(-50.25);
      expect(money.getCents()).toBe(-5025);
    });

    it("should handle single decimal place", () => {
      const money = Money.fromNumber(10.5);
      expect(money.toNumber()).toBe(10.5);
      expect(money.getCents()).toBe(1050);
    });

    it("should handle two decimal places", () => {
      const money = Money.fromNumber(99.99);
      expect(money.toNumber()).toBe(99.99);
      expect(money.getCents()).toBe(9999);
    });

    it("should handle various valid 2 decimal place amounts", () => {
      const money1 = Money.fromNumber(10.12);
      expect(money1.getCents()).toBe(1012);

      const money2 = Money.fromNumber(10.13);
      expect(money2.getCents()).toBe(1013);

      const money3 = Money.fromNumber(10.99);
      expect(money3.getCents()).toBe(1099);

      const money4 = Money.fromNumber(0.01);
      expect(money4.getCents()).toBe(1);
    });

    it("should throw error for non-finite values", () => {
      expect(() => Money.fromNumber(NaN)).toThrow(
        "Invalid monetary amount: not finite"
      );
      expect(() => Money.fromNumber(Infinity)).toThrow(
        "Invalid monetary amount: not finite"
      );
      expect(() => Money.fromNumber(-Infinity)).toThrow(
        "Invalid monetary amount: not finite"
      );
    });

    it("should throw error for more than 2 decimal places", () => {
      expect(() => Money.fromNumber(10.123)).toThrow(
        "Amount must have at most 2 decimal places"
      );
      expect(() => Money.fromNumber(0.001)).toThrow(
        "Amount must have at most 2 decimal places"
      );
    });
  });

  describe("fromCents", () => {
    it("should create Money from cents", () => {
      const money = Money.fromCents(12345);
      expect(money.getCents()).toBe(12345);
      expect(money.toNumber()).toBe(123.45);
    });

    it("should create Money from zero cents", () => {
      const money = Money.fromCents(0);
      expect(money.getCents()).toBe(0);
      expect(money.toNumber()).toBe(0);
    });

    it("should create Money from negative cents", () => {
      const money = Money.fromCents(-500);
      expect(money.getCents()).toBe(-500);
      expect(money.toNumber()).toBe(-5);
    });

    it("should throw error for non-integer cents", () => {
      expect(() => Money.fromCents(100.5)).toThrow(
        "Money cents must be an integer"
      );
    });
  });

  describe("getCurrency", () => {
    it("should return USD currency", () => {
      const money = Money.fromNumber(100);
      expect(money.getCurrency()).toBe("USD");
    });
  });

  describe("plus", () => {
    it("should add two positive amounts", () => {
      const a = Money.fromNumber(100);
      const b = Money.fromNumber(50.5);
      const result = a.plus(b);

      expect(result.toNumber()).toBe(150.5);
      expect(result.getCents()).toBe(15050);
    });

    it("should add positive and negative amounts", () => {
      const a = Money.fromNumber(100);
      const b = Money.fromNumber(-30);
      const result = a.plus(b);

      expect(result.toNumber()).toBe(70);
    });

    it("should add two negative amounts", () => {
      const a = Money.fromNumber(-50);
      const b = Money.fromNumber(-25.5);
      const result = a.plus(b);

      expect(result.toNumber()).toBe(-75.5);
    });

    it("should return new instance without mutating originals", () => {
      const a = Money.fromNumber(100);
      const b = Money.fromNumber(50);
      const result = a.plus(b);

      expect(a.toNumber()).toBe(100);
      expect(b.toNumber()).toBe(50);
      expect(result.toNumber()).toBe(150);
    });
  });

  describe("minus", () => {
    it("should subtract two positive amounts", () => {
      const a = Money.fromNumber(100);
      const b = Money.fromNumber(30.5);
      const result = a.minus(b);

      expect(result.toNumber()).toBe(69.5);
    });

    it("should subtract resulting in negative", () => {
      const a = Money.fromNumber(50);
      const b = Money.fromNumber(75);
      const result = a.minus(b);

      expect(result.toNumber()).toBe(-25);
    });

    it("should subtract negative amount (effectively adding)", () => {
      const a = Money.fromNumber(100);
      const b = Money.fromNumber(-50);
      const result = a.minus(b);

      expect(result.toNumber()).toBe(150);
    });

    it("should return new instance without mutating originals", () => {
      const a = Money.fromNumber(100);
      const b = Money.fromNumber(30);
      const result = a.minus(b);

      expect(a.toNumber()).toBe(100);
      expect(b.toNumber()).toBe(30);
      expect(result.toNumber()).toBe(70);
    });
  });

  describe("equals", () => {
    it("should return true for equal amounts", () => {
      const a = Money.fromNumber(100.5);
      const b = Money.fromNumber(100.5);

      expect(a.equals(b)).toBe(true);
    });

    it("should return true for equal amounts created differently", () => {
      const a = Money.fromNumber(100.5);
      const b = Money.fromCents(10050);

      expect(a.equals(b)).toBe(true);
    });

    it("should return false for different amounts", () => {
      const a = Money.fromNumber(100);
      const b = Money.fromNumber(100.01);

      expect(a.equals(b)).toBe(false);
    });

    it("should return true for zero amounts", () => {
      const a = Money.fromNumber(0);
      const b = Money.fromCents(0);

      expect(a.equals(b)).toBe(true);
    });
  });

  describe("immutability", () => {
    it("should not mutate when using plus", () => {
      const original = Money.fromNumber(100);
      const originalCents = original.getCents();

      original.plus(Money.fromNumber(50));

      expect(original.getCents()).toBe(originalCents);
    });

    it("should not mutate when using minus", () => {
      const original = Money.fromNumber(100);
      const originalCents = original.getCents();

      original.minus(Money.fromNumber(50));

      expect(original.getCents()).toBe(originalCents);
    });
  });

  describe("edge cases", () => {
    it("should handle very large amounts", () => {
      const money = Money.fromNumber(999999999.99);
      expect(money.getCents()).toBe(99999999999);
      expect(money.toNumber()).toBe(999999999.99);
    });

    it("should handle very small negative amounts", () => {
      const money = Money.fromNumber(-0.01);
      expect(money.getCents()).toBe(-1);
      expect(money.toNumber()).toBe(-0.01);
    });

    it("should handle addition resulting in zero", () => {
      const a = Money.fromNumber(50);
      const b = Money.fromNumber(-50);
      const result = a.plus(b);

      expect(result.toNumber()).toBe(0);
      expect(result.getCents()).toBe(0);
    });
  });
});
