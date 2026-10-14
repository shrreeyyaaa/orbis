"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  Landmark,
  Lightbulb,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useScope } from "@/components/scope-context";
import { useCurrency } from "@/components/currency-context";
import { filterPortfolio } from "@/lib/scope";
import { computeNetWorth, computeNetWorthHistory } from "@/lib/networth";
import { toBase } from "@/lib/fx";
import { getMinorDigits, formatMoney } from "@/lib/currency";
import { GROUP_COLORS, GOAL_TYPE_LABELS, annualize } from "@/lib/labels";
import { computeHealthScore } from "@/lib/health-score";
import { buildInsightsInput } from "@/lib/insights-input";
import { computeInsights } from "@/lib/insights";
import { InsightsMini } from "@/components/insights-feed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendChart, AllocationDonut } from "@/components/charts";
import { HealthScoreCard } from "@/components/health-score-ring";
import { GettingStarted, type SetupStep } from "@/components/getting-started";
import { Reveal } from "@/components/motion/reveal";
import { NetWorthHero } from "@/components/net-worth-hero";
import { WealthAtlas } from "@/components/wealth-atlas";
import type { Portfolio } from "@/lib/load";
import type { Expense, Goal, Household, IncomeSource, Owner, Valuation } from "@/lib/types";

function formatAsOf(date: string | null) {
  if (!date) return "No valuation history";
  return `As of ${new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`))}`;
}

export function DashboardView({
  household,
  owners,
  portfolio,
  valuations,
  incomeSources,
  expenses,
  goals,
}: {
  household: Household;
  owners: Owner[];
  portfolio: Portfolio;
  valuations: Valuation[];
  incomeSources: IncomeSource[];
  expenses: Expense[];
  goals: Goal[];
  earnedKeys: string[];
}) {
  const router = useRouter();
  const { ownerIds, includesOwner } = useScope();
  const { reportingCurrency, displayCurrency, rates, show, toDisplay } = useCurrency();
  const [seeding, setSeeding] = useState(false);

  const isEmpty =
    portfolio.accounts.length === 0 &&
    portfolio.holdings.length === 0 &&
    portfolio.assets.length === 0 &&
    portfolio.liabilities.length === 0;

  const scoped = useMemo(() => filterPortfolio(portfolio, ownerIds), [portfolio, ownerIds]);
  const nw = useMemo(
    () =>
      computeNetWorth({
        reportingCurrency,
        rates,
        owners,
        accounts: scoped.accounts,
        holdings: scoped.holdings,
        assets: scoped.assets,
        liabilities: scoped.liabilities,
        ownership: scoped.ownership,
      }),
    [scoped, owners, reportingCurrency, rates],
  );

  const nwAll = useMemo(
    () =>
      computeNetWorth({
        reportingCurrency,
        rates,
        owners,
        accounts: portfolio.accounts,
        holdings: portfolio.holdings,
        assets: portfolio.assets,
        liabilities: portfolio.liabilities,
        ownership: portfolio.ownership,
      }),
    [portfolio, owners, reportingCurrency, rates],
  );

  const currentYear = String(new Date().getFullYear());
  const annualIncomeAll = useMemo(
    () =>
      incomeSources
        .filter((source) => source.is_active)
        .reduce(
          (sum, source) =>
            sum + toBase(annualize(source.expected_amount_minor, source.cadence), source.currency, reportingCurrency, rates),
          0,
        ),
    [incomeSources, reportingCurrency, rates],
  );
  const annualExpensesAll = useMemo(
    () =>
      expenses.reduce((sum, expense) => {
        const amount = expense.is_recurring && expense.cadence
          ? annualize(expense.amount_minor, expense.cadence)
          : expense.spent_on.startsWith(currentYear)
            ? expense.amount_minor
            : 0;
        return sum + toBase(amount, expense.currency, reportingCurrency, rates);
      }, 0),
    [expenses, currentYear, reportingCurrency, rates],
  );

  const annualIncome = useMemo(
    () =>
      incomeSources
        .filter((source) => source.is_active && includesOwner(source.owner_id))
        .reduce(
          (sum, source) =>
            sum + toBase(annualize(source.expected_amount_minor, source.cadence), source.currency, reportingCurrency, rates),
          0,
        ),
    [incomeSources, includesOwner, reportingCurrency, rates],
  );
  const annualExpenses = useMemo(
    () =>
      expenses
        .filter((expense) => includesOwner(expense.owner_id))
        .reduce((sum, expense) => {
          const amount = expense.is_recurring && expense.cadence
            ? annualize(expense.amount_minor, expense.cadence)
            : expense.spent_on.startsWith(currentYear)
              ? expense.amount_minor
              : 0;
          return sum + toBase(amount, expense.currency, reportingCurrency, rates);
        }, 0),
    [expenses, includesOwner, currentYear, reportingCurrency, rates],
  );

  const latestValuationDate = valuations.length
    ? valuations.reduce((latest, valuation) =>
        valuation.as_of_date > latest ? valuation.as_of_date : latest,
      valuations[0].as_of_date)
    : null;

  const health = useMemo(() => {
    const liquid = nwAll.byGroup.find((group) => group.group === "Cash & Equivalents")?.valueMinor ?? 0;
    const goalsWithTarget = goals.filter((goal) => goal.target_minor > 0);
    const goalFundingAvg = goalsWithTarget.length === 0
      ? null
      : goalsWithTarget.reduce(
          (sum, goal) => sum + Math.min(1, goal.manual_saved_minor / goal.target_minor),
          0,
        ) / goalsWithTarget.length;
    const daysSinceUpdate = latestValuationDate
      ? Math.max(0, Math.round((Date.now() - new Date(`${latestValuationDate}T00:00:00`).getTime()) / 86400000))
      : null;
    return computeHealthScore({
      netWorthMinor: nwAll.netWorthMinor,
      totalAssetsMinor: nwAll.totalAssetsMinor,
      totalLiabilitiesMinor: nwAll.totalLiabilitiesMinor,
      liquidMinor: liquid,
      annualIncomeMinor: annualIncomeAll,
      annualExpensesMinor: annualExpensesAll,
      assetGroupCount: nwAll.byGroup.length,
      goalFundingAvg,
      daysSinceUpdate,
    });
  }, [nwAll, goals, latestValuationDate, annualIncomeAll, annualExpensesAll]);

  const scopedHoldableIds = useMemo(
    () =>
      new Set([
        ...scoped.accounts.map((account) => account.id),
        ...scoped.holdings.map((holding) => holding.id),
        ...scoped.assets.map((asset) => asset.id),
        ...scoped.liabilities.map((liability) => liability.id),
      ]),
    [scoped],
  );

  const trendRaw = useMemo(() => {
    const filtered = valuations.filter((valuation) => scopedHoldableIds.has(valuation.holdable_id));
    return computeNetWorthHistory(filtered, reportingCurrency, rates, 24);
  }, [valuations, scopedHoldableIds, reportingCurrency, rates]);

  const displayDigits = getMinorDigits(displayCurrency);
  const toMajorDisplay = (minorReporting: number) => toDisplay(minorReporting) / 10 ** displayDigits;
  const trend = trendRaw.map((point) => ({ label: point.date.slice(0, 7), value: toMajorDisplay(point.netWorthMinor) }));
  const netChangeMinor = trendRaw.length >= 2
    ? trendRaw[trendRaw.length - 1].netWorthMinor - trendRaw[0].netWorthMinor
    : 0;
  const fmtAxis = (major: number) =>
    formatMoney(Math.round(major * 10 ** displayDigits), displayCurrency, { compact: true });
  const animMoney = (minorReporting: number) => ({
    numericValue: toMajorDisplay(minorReporting),
    format: (value: number) => formatMoney(Math.round(value * 10 ** displayDigits), displayCurrency),
  });

  const allocation = nw.byGroup.map((group) => ({
    name: group.group,
    value: toMajorDisplay(group.valueMinor),
    color: GROUP_COLORS[group.group] ?? "#94a3b8",
  }));
  const allocationTotal = allocation.reduce((sum, item) => sum + item.value, 0);

  const scopedGoals = goals.filter((goal) => goal.owner_id == null || includesOwner(goal.owner_id));
  const topInsights = useMemo(
    () =>
      computeInsights(
        buildInsightsInput({
          nw,
          goals: scopedGoals,
          liabilities: scoped.liabilities,
          owners,
          valuations,
          annualIncomeMinor: annualIncome,
          annualExpensesMinor: annualExpenses,
          reportingCurrency,
          rates,
        }),
      ).slice(0, 3),
    [nw, scopedGoals, scoped, owners, valuations, annualIncome, annualExpenses, reportingCurrency, rates],
  );

  const valuedIds = new Set(
    valuations
      .filter((valuation) => scopedHoldableIds.has(valuation.holdable_id))
      .map((valuation) => valuation.holdable_id),
  );
  const coveragePct = scopedHoldableIds.size > 0
    ? Math.round((valuedIds.size / scopedHoldableIds.size) * 100)
    : 0;
  const liquidMinor = nw.byGroup.find((group) => group.group === "Cash & Equivalents")?.valueMinor ?? 0;
  const monthlyOutflow = annualExpenses / 12;
  const runwayMonths = monthlyOutflow > 0 ? liquidMinor / monthlyOutflow : null;
  const nextGoal = [...scopedGoals]
    .filter((goal) => goal.target_date)
    .sort((a, b) => (a.target_date ?? "").localeCompare(b.target_date ?? ""))[0] ?? scopedGoals[0];

  const setupSteps: SetupStep[] = [
    { label: "Add family members & entities", done: owners.length >= 2, href: "/family" },
    { label: "Add an account", done: portfolio.accounts.length > 0, href: "/accounts" },
    { label: "Add an asset", done: portfolio.assets.length > 0, href: "/assets" },
    { label: "Track a liability", done: portfolio.liabilities.length > 0, href: "/liabilities" },
    { label: "Record income", done: incomeSources.length > 0, href: "/cashflow?view=income&new=income" },
    { label: "Record expenses", done: expenses.length > 0, href: "/cashflow?view=expenses&new=expense" },
    { label: "Set a goal", done: goals.length > 0, href: "/goals" },
  ];

  async function loadSample() {
    setSeeding(true);
    await createClient().rpc("seed_demo_household", { p_household_id: household.id });
    router.refresh();
    setSeeding(false);
  }

  return (
    <div className="mx-auto max-w-[96rem]">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">Morning brief</p>
          <h1 className="mt-2 max-w-3xl font-serif text-3xl font-semibold tracking-tight sm:text-4xl">Your family&apos;s wealth, in focus.</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">What changed, what needs attention, and how the household is positioned now.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/events" className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm font-medium hover:bg-muted">
            <CalendarDays className="h-4 w-4 text-muted-foreground" aria-hidden /> Activity
          </Link>
          <Link href="/simulate" className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            Stress test plan <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </header>

      <GettingStarted steps={setupSteps} onLoadSample={isEmpty ? loadSample : undefined} seeding={seeding} />

      {nw.missingRates && (
        <div role="status" className="mt-4 flex items-start gap-3 rounded-xl border border-amber-400/35 bg-amber-400/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span><strong>Total incomplete.</strong> Items without a valid exchange rate are excluded. Add a current rate in Settings before using the total for decisions.</span>
        </div>
      )}

      <div className="mt-5">
        <NetWorthHero
          householdName={household.name}
          {...animMoney(nw.netWorthMinor)}
          positive={netChangeMinor >= 0}
          deltaLabel={netChangeMinor !== 0 ? `${show(Math.abs(netChangeMinor))} over valued history` : undefined}
          spark={trend.map((point) => ({ value: point.value }))}
          note={displayCurrency !== reportingCurrency ? `Reporting currency: ${reportingCurrency}` : undefined}
          asOfLabel={formatAsOf(latestValuationDate)}
          coverageLabel={`${coveragePct}% valuation coverage`}
          stats={[
            { label: "Assets", value: show(nw.totalAssetsMinor) },
            { label: "Liabilities", value: show(nw.totalLiabilitiesMinor), tone: nw.totalLiabilitiesMinor > 0 ? "negative" : "default" },
            { label: "Income / yr", value: show(annualIncome), tone: "positive" },
            { label: "Net cash / yr", value: show(annualIncome - annualExpenses), tone: annualIncome - annualExpenses >= 0 ? "positive" : "negative" },
          ]}
        />
      </div>

      {!isEmpty && (
        <div className="mt-6 grid gap-4">
          <Reveal>
            <WealthAtlas householdName={household.name} owners={owners} items={nw.items} ownership={scoped.ownership} netWorthMinor={nw.netWorthMinor} formatValue={show} />
          </Reveal>

          <Reveal delay={0.06}>
            <Card className="overflow-hidden border-primary/20">
              <div className="orbit-rule h-0.5 w-full" />
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-primary">Action desk</p>
                    <CardTitle className="mt-2">What needs attention</CardTitle>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2 py-1 font-mono text-xs font-semibold text-primary tabular-nums">{topInsights.length}</span>
                </div>
              </CardHeader>
              <CardContent>
                {topInsights.length > 0 ? <InsightsMini insights={topInsights} className="sm:grid sm:grid-cols-2 sm:gap-2 sm:space-y-0 xl:grid-cols-3" /> : (
                  <div className="rounded-2xl border border-dashed border-border p-6 text-center">
                    <ShieldCheck className="mx-auto h-6 w-6 text-success" aria-hidden />
                    <p className="mt-2 text-sm font-medium">Nothing urgent</p>
                    <p className="mt-1 text-xs text-muted-foreground">Orbis will surface actions as your data changes.</p>
                  </div>
                )}
                <Link href="/insights" className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">Open action desk <ArrowRight className="h-3.5 w-3.5" aria-hidden /></Link>
              </CardContent>
            </Card>
          </Reveal>
        </div>
      )}

      {!isEmpty && (
        <section aria-label="Household position" className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <PositionCard icon={Wallet} label="Liquidity runway" value={runwayMonths == null ? "Not available" : `${runwayMonths.toFixed(1)} months`} detail="Cash against recorded outflow" tone={runwayMonths != null && runwayMonths < 3 ? "negative" : "positive"} />
          <PositionCard icon={ShieldCheck} label="Stewardship posture" value={`${health.score} · ${health.tier}`} detail="Liquidity, resilience and planning" tone={health.score >= 65 ? "positive" : "neutral"} />
          <PositionCard icon={Landmark} label="Valuation coverage" value={`${coveragePct}%`} detail={`${valuedIds.size} of ${scopedHoldableIds.size} records have history`} tone={coveragePct >= 80 ? "positive" : "neutral"} />
          <PositionCard icon={nextGoal ? TrendingUp : Lightbulb} label="Next goal" value={nextGoal?.name ?? "Set your first goal"} detail={nextGoal?.target_date ? `Target ${formatAsOf(nextGoal.target_date).replace("As of ", "")}` : "Turn wealth into a funded plan"} tone="neutral" />
        </section>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="overflow-hidden xl:col-span-2">
          <CardHeader className="flex-row items-start justify-between space-y-0">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Valued history</p>
              <CardTitle className="mt-2">How household wealth is moving</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">Historical values currently use the latest available household FX rates.</p>
            </div>
            <Link href="/net-worth" className="text-xs font-semibold text-primary hover:underline">Investigate</Link>
          </CardHeader>
          <CardContent>
            {trend.length >= 2 ? <TrendChart data={trend} formatValue={fmtAxis} /> : <p className="py-20 text-center text-sm text-muted-foreground">Add valuation updates to build a trustworthy change story.</p>}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Capital structure</p>
            <CardTitle className="mt-2">Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            {allocation.length > 0 ? (
              <>
                <AllocationDonut data={allocation} formatValue={fmtAxis} centerSub="Assets" centerLabel={fmtAxis(toMajorDisplay(nw.totalAssetsMinor))} />
                <div className="space-y-2">
                  {allocation.slice(0, 5).map((item) => (
                    <div key={item.name} className="flex items-center gap-2 text-xs">
                      <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
                      <span className="min-w-0 flex-1 truncate">{item.name}</span>
                      <span className="font-mono text-muted-foreground tabular-nums">{allocationTotal > 0 ? Math.round((item.value / allocationTotal) * 100) : 0}%</span>
                    </div>
                  ))}
                </div>
              </>
            ) : <p className="py-20 text-center text-sm text-muted-foreground">No assets recorded.</p>}
          </CardContent>
        </Card>
      </div>

      {!isEmpty && (
        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1.35fr]">
          <Card>
            <CardHeader>
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Household readiness</p>
              <CardTitle className="mt-2">Where the picture can improve</CardTitle>
            </CardHeader>
            <CardContent>
              <HealthScoreCard result={health} />
              {health.topTip && <div className="mt-5 flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/10 p-3 text-sm"><Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden /><span><strong>Priority:</strong> {health.topTip}</span></div>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Funded intentions</p>
                <CardTitle className="mt-2">Goal trajectories</CardTitle>
              </div>
              <Link href="/goals" className="text-xs font-semibold text-primary hover:underline">View plan</Link>
            </CardHeader>
            <CardContent>
              {scopedGoals.length === 0 ? <p className="py-12 text-center text-sm text-muted-foreground">No goals yet. Add a goal to connect today&apos;s wealth with a future decision.</p> : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {scopedGoals.slice(0, 4).map((goal) => {
                    const saved = toBase(goal.manual_saved_minor, goal.currency, reportingCurrency, rates);
                    const target = toBase(goal.target_minor, goal.currency, reportingCurrency, rates);
                    const pct = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;
                    return (
                      <Link key={goal.id} href="/goals" className="group rounded-2xl border border-border/70 bg-background/35 p-4 transition-colors hover:border-primary/35 hover:bg-primary/5">
                        <div className="flex items-start justify-between gap-2">
                          <div><p className="text-sm font-semibold">{goal.name}</p><p className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{GOAL_TYPE_LABELS[goal.type]}</p></div>
                          <span className="font-mono text-xs font-semibold text-primary tabular-nums">{pct}%</span>
                        </div>
                        <Progress value={pct} className="mt-4 h-1.5" indicatorClassName={pct >= 100 ? "bg-success" : "bg-gold"} />
                        <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground"><span className="font-mono tabular-nums">{show(saved)}</span><ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden /></div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function PositionCard({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  detail: string;
  tone: "positive" | "negative" | "neutral";
}) {
  return (
    <div className="group min-w-0 rounded-2xl border border-border/70 bg-card/75 p-4 transition-colors hover:border-primary/30">
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
        <Icon className={`h-4 w-4 ${tone === "positive" ? "text-success" : tone === "negative" ? "text-destructive" : "text-gold"}`} aria-hidden />
      </div>
      <p className={`mt-3 truncate font-mono text-lg font-semibold tabular-nums ${tone === "negative" ? "text-destructive" : ""}`}>{value}</p>
      <p className="mt-1 truncate text-[11px] text-muted-foreground">{detail}</p>
    </div>
  );
}
