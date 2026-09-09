import { getHouseholdContext } from "@/lib/household";
import { createClient } from "@/lib/supabase/server";
import { loadPortfolio, loadValuations } from "@/lib/load";
import { computeNetWorth } from "@/lib/networth";
import { buildRateMap, toBase } from "@/lib/fx";
import { buildInsightsInput } from "@/lib/insights-input";
import {
  computeInsights,
  filterInsightsByScope,
  type Insight,
  type InsightScope,
} from "@/lib/insights";
import { annualize } from "@/lib/labels";
import type { Expense, ExchangeRate, Goal, GoalIncomeAllocation, IncomeSource } from "@/lib/types";
import { monthlyAllocationMinor } from "@/lib/goal-funding";

/** Load household insights filtered by page scope. */
export async function loadScopedInsights(scope: InsightScope): Promise<Insight[]> {
  const ctx = await getHouseholdContext();
  if (!ctx) return [];
  const hid = ctx.household.id;
  const supabase = await createClient();

  const [portfolio, valuations, incomeRes, expenseRes, goalRes, rateRes, allocRes] =
    await Promise.all([
      loadPortfolio(hid),
      loadValuations(hid),
      supabase.from("income_sources").select("*").eq("household_id", hid),
      supabase.from("expenses").select("*").eq("household_id", hid),
      supabase.from("goals").select("*").eq("household_id", hid),
      supabase.from("exchange_rates").select("*").eq("household_id", hid),
      supabase.from("goal_income_allocations").select("*").eq("household_id", hid),
    ]);

  const reportingCurrency = ctx.household.reporting_currency;
  const rates = buildRateMap((rateRes.data ?? []) as ExchangeRate[]);
  const incomeSources = (incomeRes.data ?? []) as IncomeSource[];
  const expenses = (expenseRes.data ?? []) as Expense[];
  const goals = (goalRes.data ?? []) as Goal[];
  const allocations = (allocRes.data ?? []) as GoalIncomeAllocation[];

  const nw = computeNetWorth({
    reportingCurrency,
    rates,
    owners: ctx.owners,
    accounts: portfolio.accounts,
    holdings: portfolio.holdings,
    assets: portfolio.assets,
    liabilities: portfolio.liabilities,
    ownership: portfolio.ownership,
  });

  const annualIncomeMinor = incomeSources
    .filter((s) => s.is_active)
    .reduce(
      (sum, s) =>
        sum + toBase(annualize(s.expected_amount_minor, s.cadence), s.currency, reportingCurrency, rates),
      0,
    );
  const annualExpensesMinor = expenses.reduce((sum, e) => {
    const amt = e.is_recurring && e.cadence ? annualize(e.amount_minor, e.cadence) : e.amount_minor;
    return sum + toBase(amt, e.currency, reportingCurrency, rates);
  }, 0);

  const monthlySurplusMinor = (annualIncomeMinor - annualExpensesMinor) / 12;
  const incomeById = new Map(incomeSources.map((s) => [s.id, s]));
  const monthlyAllocatedToGoalsMinor = allocations
    .filter((a) => a.is_active)
    .reduce((sum, a) => {
      const src = incomeById.get(a.income_source_id);
      if (!src) return sum;
      const monthly = monthlyAllocationMinor(a, src);
      return sum + toBase(monthly, src.currency, reportingCurrency, rates);
    }, 0);

  const input = buildInsightsInput({
    nw,
    goals,
    liabilities: portfolio.liabilities,
    owners: ctx.owners,
    valuations,
    annualIncomeMinor,
    annualExpensesMinor,
    reportingCurrency,
    rates,
  });
  input.monthlySurplusMinor = monthlySurplusMinor;
  input.monthlyAllocatedToGoalsMinor = monthlyAllocatedToGoalsMinor;

  return filterInsightsByScope(computeInsights(input), scope);
}
