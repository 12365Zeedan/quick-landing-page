// Source-level regression guards.
// These tests grep the actual statements.tsx and vat.tsx files to ensure
// the opening/closing inventory VAT formulas remain correct and that
// closing inventory VAT is never added to input VAT or net VAT payable.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const statementsSrc = readFileSync(
  resolve(__dirname, "../routes/statements.tsx"),
  "utf8",
);
const vatSrc = readFileSync(resolve(__dirname, "../routes/vat.tsx"), "utf8");

// Strip line/block comments so wording in comments cannot trip the assertions.
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}
const statementsCode = stripComments(statementsSrc);
const vatCode = stripComments(vatSrc);

describe("statements.tsx — VAT formula invariants", () => {
  it("inputVatTotal formula adds opening inventory VAT exactly once", () => {
    expect(statementsCode).toMatch(
      /inputVatTotal\s*=\s*allExpensesVat\s*\+\s*allPurchasesVat\s*\+\s*\(openings\.inventoryVat\s*\|\|\s*0\)/,
    );
  });

  it("inputVatTotal formula does NOT include closingInventoryVat", () => {
    const m = statementsCode.match(/const\s+inputVatTotal\s*=\s*[^;]+;/);
    expect(m, "inputVatTotal definition not found").toBeTruthy();
    expect(m![0]).not.toMatch(/closingInventoryVat/);
  });

  it("netVatPayable in P&L subtracts opening inventory VAT (no double-count)", () => {
    expect(statementsCode).toMatch(
      /filteredPeriod\.outputVat\s*-\s*filteredPeriod\.vat\s*-\s*\(openings\.inventoryVat\s*\|\|\s*0\)/,
    );
  });

  it("closingInventoryVat is exposed only as a memo", () => {
    expect(statementsCode).toMatch(
      /closingInventoryVatMemo\s*=\s*openings\.closingInventoryVat\s*\|\|\s*0/,
    );
    // Memo must not appear inside any arithmetic sum that feeds totals.
    const badPatterns = [
      /inputVatTotal[^;]*closingInventoryVatMemo/,
      /closingInventoryVatMemo[^;\n]*\+\s*(allExpensesVat|allPurchasesVat|inputVatTotal)/,
    ];
    for (const re of badPatterns) {
      expect(statementsCode).not.toMatch(re);
    }
  });
});

describe("vat.tsx — opening inventory VAT carry-forward", () => {
  it("declares a reader for opening + closing inventory VAT", () => {
    expect(vatCode).toMatch(/function\s+readOpeningInventoryVat/);
    expect(vatCode).toMatch(/inventoryVat/);
    expect(vatCode).toMatch(/closingInventoryVat/);
  });

  it("adds opening inventory VAT as a single synthetic input entry", () => {
    expect(vatCode).toMatch(/id:\s*["']opening-inventory-vat["']/);
    expect(vatCode).toMatch(/direction:\s*["']input["']/);
    expect(vatCode).toMatch(/category:\s*["']openingInventoryVat["']/);
  });

  it("does NOT push a closing inventory VAT entry into the VAT ledger", () => {
    // Closing inventory VAT is informational only — never an input/output entry.
    expect(vatCode).not.toMatch(/id:\s*["']closing-inventory-vat["']/);
    expect(vatCode).not.toMatch(
      /direction:\s*["']input["'][^}]*closingInventoryVat/,
    );
  });

  it("renders closing inventory VAT as a memo line, not in the net VAT total", () => {
    expect(vatCode).toMatch(/closingInventoryVatMemo/);
    // netVat math must use outputVat - inputVat only.
    expect(vatCode).toMatch(/netVat\s*=\s*outputVat\s*-\s*inputVat/);
  });
});
