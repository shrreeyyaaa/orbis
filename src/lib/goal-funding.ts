import { annualize } from "@/lib/labels";
import type { GoalIncomeAllocation, IncomeSource } from "@/lib/types";

/** Monthly amount (source currency minor units) from an allocation rule. */
export function monthlyAllocationMinor(
  allocation: GoalIncomeAllocation,
  source: IncomeSource,
): number {
  const monthlyIncome = annualize(source.expected_amount_minor, source.cadence) / 12;
  if (allocation.mode === "pct") {
    return Math.round((monthlyIncome * allocation.value_bps) / 10_000);
  }
  return allocation.value_minor;
}

/** Effective saved = manual_saved + sum of contributions (when tracked separately). */
export function effectiveSavedMinor(
  manualSavedMinor: number,
  contributionSumMinor = 0,
): number {
  return manualSavedMinor + contributionSumMinor;
}
