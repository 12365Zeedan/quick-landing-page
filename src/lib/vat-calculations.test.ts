import { describe, it, expect } from "vitest";
import { computeVatTotals, computeInventory } from "./vat-calculations";

describe("computeVatTotals — opening/closing inventory VAT invariants", () => {
  const base = {
    outputVat: 1500,
    expensesVat: 200,
    purchasesVat: 600,
    openingInventoryVat: 100,
    closingInventoryVat: 300,
  };

  it("includes opening inventory VAT in input VAT exactly once", () => {
    const r = computeVatTotals(base);
    expect(r.inputVatTotal).toBe(200 + 600 + 100); // 900
  });

  it("does NOT include closing inventory VAT in input VAT (no double-counting)", () => {
    const r = computeVatTotals(base);
    expect(r.inputVatTotal).not.toBe(200 + 600 + 100 + 300);
    // Sanity: increasing closing inventory VAT must not change input VAT total.
    const r2 = computeVatTotals({ ...base, closingInventoryVat: 9999 });
    expect(r2.inputVatTotal).toBe(r.inputVatTotal);
  });

  it("net VAT payable = output - (expenses + purchases + opening) and ignores closing", () => {
    const r = computeVatTotals(base);
    expect(r.netVatPayable).toBe(1500 - 900);
    const r2 = computeVatTotals({ ...base, closingInventoryVat: 50000 });
    expect(r2.netVatPayable).toBe(r.netVatPayable);
  });

  it("exposes closing inventory VAT as a memo only (not folded into totals)", () => {
    const r = computeVatTotals(base);
    expect(r.closingInventoryVatMemo).toBe(300);
    // Memo value must equal raw input, never aggregated.
    expect(r.closingInventoryVatMemo).toBe(base.closingInventoryVat);
  });

  it("handles missing/zero inventory VAT fields safely", () => {
    const r = computeVatTotals({
      outputVat: 500,
      expensesVat: 100,
      purchasesVat: 50,
      openingInventoryVat: 0,
      closingInventoryVat: 0,
    });
    expect(r.inputVatTotal).toBe(150);
    expect(r.netVatPayable).toBe(350);
    expect(r.closingInventoryVatMemo).toBe(0);
  });

  it("opening VAT increases input VAT 1:1 and reduces net payable 1:1", () => {
    const a = computeVatTotals({ ...base, openingInventoryVat: 0 });
    const b = computeVatTotals({ ...base, openingInventoryVat: 100 });
    expect(b.inputVatTotal - a.inputVatTotal).toBe(100);
    expect(a.netVatPayable - b.netVatPayable).toBe(100);
  });
});

describe("computeInventory — period-end snapshot", () => {
  it("uses closing inventory when provided", () => {
    expect(
      computeInventory({
        openingInventory: 1000,
        closingInventory: 750,
        purchasesSubtotal: 500,
        cogsFromExpenses: 400,
      }),
    ).toBe(750);
  });

  it("falls back to opening + purchases - COGS when no closing entered", () => {
    expect(
      computeInventory({
        openingInventory: 1000,
        closingInventory: 0,
        purchasesSubtotal: 500,
        cogsFromExpenses: 300,
      }),
    ).toBe(1200);
  });

  it("inventory snapshot is VAT-exclusive (uses subtotal, not VAT)", () => {
    // Regression guard: VAT must never leak into inventory valuation.
    const withVat = computeInventory({
      openingInventory: 1000,
      closingInventory: 0,
      purchasesSubtotal: 500, // subtotal only
      cogsFromExpenses: 0,
    });
    expect(withVat).toBe(1500);
  });
});
