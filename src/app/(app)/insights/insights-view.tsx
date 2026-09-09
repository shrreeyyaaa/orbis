"use client";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useScope } from "@/components/scope-context";
import { useCurrency } from "@/components/currency-context";
import { filterPortfolio } from "@/lib/scope";
import { computeNetWorth } from "@/lib/networth";
import { toBase } from "@/lib/fx";
import { annualize } from "@/lib/labels";
import { buildInsightsInput } from "@/lib/insights-input";
import {
  computeInsights,
  filterInsightsByScope,
  type InsightScope,
} from "@/lib/insights";
import { PageHeader } from "@/components/ui-bits";
import { InsightsFeed } from "@/components/insights-feed";
import type { Portfolio } from "@/lib/load";
import type { Expense, Goal, IncomeSource, Owner, Valuation } from "@/lib/types";

const SCOPES: { id: InsightScope; label: string }[] = [
  { id: "all", label: "All" },
  { id: "liquidity", label: "Liquidity" },
  { id: "goals", label: "Goals" },
  { id: "cashflow", label: "Cash flow" },
  { id: "debt", label: "Debt" },
  { id: "allocation", label: "Allocation" },
  { id: "estate", label: "Estate" },
  { id: "investing", label: "Investing" },
  { id: "data", label: "Data" },
];

function parseScope(raw: string | null): InsightScope {
  const ids = SCOPES.map((s) => s.id);
  if (raw && (ids as string[]).includes(raw)) return raw as InsightScope;
  return "all";
}

export function InsightsView({
  owners,
  portfolio,
  valuations,
  incomeSources,
  expenses,
  goals,
}: {
  owners: Owner[];
  portfolio: Portfolio;
  valuations: Valuation[];
  incomeSources: IncomeSource[];
  expenses: Expense[];
  goals: Goal[];
}) {
  const searchParams = useSearchParams();
  const scope = parseScope(searchParams.get("scope"));
  const { ownerIds, includesOwner } = useScope();
  const { reportingCurrency, rates } = useCurrency();

  const insights = useMemo(() => {
    const scoped = filterPortfolio(portfolio, ownerIds);
    const nw = computeNetWorth({
      reportingCurrency,
      rates,
      owners,
      accounts: scoped.accounts,
      holdings: scoped.holdings,
      assets: scoped.assets,
      liabilities: scoped.liabilities,
      ownership: scoped.ownership,
    });
    const scopedIncome = incomeSources.filter((s) => includesOwner(s.owner_id));
    const scopedExpenses = expenses.filter((e) => includesOwner(e.owner_id));
    const scopedGoals = goals.filter((g) => g.owner_id == null || includesOwner(g.owner_id));
    const annualIncomeMinor = scopedIncome
      .filter((s) => s.is_active)
      .reduce(
        (sum, s) =>
          sum + toBase(annualize(s.expected_amount_minor, s.cadence), s.currency, reportingCurrency, rates),
        0,
      );
    const annualExpensesMinor = scopedExpenses.reduce((sum, e) => {
      const amt = e.is_recurring && e.cadence ? annualize(e.amount_minor, e.cadence) : e.amount_minor;
      return sum + toBase(amt, e.currency, reportingCurrency, rates);
    }, 0);

    const all = computeInsights(
      buildInsightsInput({
        nw,
        goals: scopedGoals,
        liabilities: scoped.liabilities,
        owners,
        valuations,
        annualIncomeMinor,
        annualExpensesMinor,
        reportingCurrency,
        rates,
      }),
    );
    return filterInsightsByScope(all, scope);
  }, [
    portfolio,
    ownerIds,
    includesOwner,
    owners,
    valuations,
    incomeSources,
    expenses,
    goals,
    reportingCurrency,
    rates,
    scope,
  ]);

  return (
    <div>
      <PageHeader
        title="Insights"
        description="Tailored observations from your finances. Informational only — not financial advice."
      />
      <div className="mb-4 flex flex-wrap gap-1.5">
        {SCOPES.map((s) => (
          <a
            key={s.id}
            href={`/insights?scope=${s.id}`}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              scope === s.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            {s.label}
          </a>
        ))}
      </div>
      <InsightsFeed insights={insights} />
    </div>
  );
}
