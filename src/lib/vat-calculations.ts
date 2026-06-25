// Pure VAT/inventory math used by financial statements and the VAT module.
// Extracted so accounting invariants can be enforced by unit tests
// (no double-counting of opening/closing inventory VAT).

export interface VatInputs {
  outputVat: number;          // VAT collected on sales (revenue.vat)
  expensesVat: number;        // VAT paid on expenses
  purchasesVat: number;       // VAT paid on purchases
  openingInventoryVat: number; // Recoverable VAT carried from prior period's inventory
  closingInventoryVat: number; // VAT embedded in period-end inventory (memo only)
}

export interface VatTotals {
  /** Total recoverable input VAT for the period. MUST include opening inventory VAT exactly once and MUST NOT include closing inventory VAT. */
  inputVatTotal: number;
  /** Net VAT payable to tax authority. */
  netVatPayable: number;
  /** Memo disclosure — never folded into totals. */
  closingInventoryVatMemo: number;
}

export function computeVatTotals(i: VatInputs): VatTotals {
  const opening = i.openingInventoryVat || 0;
  const inputVatTotal = (i.expensesVat || 0) + (i.purchasesVat || 0) + opening;
  const netVatPayable = (i.outputVat || 0) - inputVatTotal;
  return {
    inputVatTotal,
    netVatPayable,
    closingInventoryVatMemo: i.closingInventoryVat || 0,
  };
}

/** Balance-sheet inventory snapshot: closing if provided, else opening + purchases - COGS. */
export function computeInventory(args: {
  openingInventory: number;
  closingInventory: number;
  purchasesSubtotal: number;
  cogsFromExpenses: number;
}): number {
  if ((args.closingInventory || 0) > 0) return args.closingInventory;
  return (args.openingInventory || 0) + (args.purchasesSubtotal || 0) - (args.cogsFromExpenses || 0);
}
