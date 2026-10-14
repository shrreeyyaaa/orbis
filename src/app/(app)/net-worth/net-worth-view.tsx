"use client";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useScope } from "@/components/scope-context";
import { useCurrency } from "@/components/currency-context";
import { filterPortfolio } from "@/lib/scope";
import { computeNetWorth, computeNetWorthHistory } from "@/lib/networth";
import { getMinorDigits, formatMoney } from "@/lib/currency";
import { GROUP_COLORS, ASSET_CLASS_LABELS } from "@/lib/labels";
import { PageHeader, StatCard } from "@/components/ui-bits";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendChart } from "@/components/charts";
import type { Portfolio } from "@/lib/load";
import type { Owner, Valuation, HoldableType } from "@/lib/types";

const KIND_LABEL: Record<HoldableType, string> = {
  account: "Cash",
  holding: "Investment",
  asset: "Asset",
  liability: "Liability",
};

export function NetWorthView({
  owners,
  portfolio,
  valuations,
}: {
  owners: Owner[];
  portfolio: Portfolio;
  valuations: Valuation[];
}) {
  const { ownerIds } = useScope();
  const { reportingCurrency, displayCurrency, rates, show, toDisplay } = useCurrency();

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

  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [query, setQuery] = useState("");

  const digits = getMinorDigits(displayCurrency);
  const fmtAxis = (major: number) =>
    formatMoney(Math.round(major * 10 ** digits), displayCurrency, { compact: true });

  const scopedIds = useMemo(
    () =>
      new Set<string>([
        ...scoped.accounts.map((a) => a.id),
        ...scoped.holdings.map((h) => h.id),
        ...scoped.assets.map((a) => a.id),
        ...scoped.liabilities.map((l) => l.id),
      ]),
    [scoped],
  );

  const trend = useMemo(() => {
    const filtered = valuations.filter((v) => scopedIds.has(v.holdable_id));
    return computeNetWorthHistory(filtered, reportingCurrency, rates, 30).map((p) => ({
      label: p.date.slice(0, 7),
      value: toDisplay(p.netWorthMinor) / 10 ** digits,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valuations, scopedIds, reportingCurrency, rates, displayCurrency]);

  const sortedItems = [...nw.items].sort((a, b) => b.baseMinor - a.baseMinor);

  const keyOf = (it: (typeof sortedItems)[number]) => (it.assetClass ? `ac:${it.assetClass}` : `kind:${it.kind}`);
  const labelOf = (it: (typeof sortedItems)[number]) =>
    it.assetClass ? ASSET_CLASS_LABELS[it.assetClass] : KIND_LABEL[it.kind];
  const typeOptions = useMemo(() => {
    const m = new Map<string, { key: string; label: string; count: number }>();
    for (const it of sortedItems) {
      const k = keyOf(it);
      const cur = m.get(k);
      if (cur) cur.count++;
      else m.set(k, { key: k, label: labelOf(it), count: 1 });
    }
    return [
      { key: "all", label: "All", count: sortedItems.length },
      ...[...m.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedItems]);
  const visibleItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sortedItems.filter(
      (it) =>
        (typeFilter === "all" || keyOf(it) === typeFilter) &&
        (!q || it.name.toLowerCase().includes(q) || labelOf(it).toLowerCase().includes(q)),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedItems, typeFilter, query]);

  return (
    <div>
      <PageHeader title="Net Worth" description="A full breakdown of what you own and owe." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Net worth" value={show(nw.netWorthMinor)} accent={nw.netWorthMinor >= 0 ? "positive" : "negative"} />
        <StatCard label="Assets" value={show(nw.totalAssetsMinor)} />
        <StatCard label="Liabilities" value={show(nw.totalLiabilitiesMinor)} accent="negative" />
      </div>

      {trend.length >= 2 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>History</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendChart data={trend} formatValue={fmtAxis} />
          </CardContent>
        </Card>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>By asset class</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {nw.byGroup.map((g) => {
              const pct = nw.totalAssetsMinor > 0 ? Math.round((g.valueMinor / nw.totalAssetsMinor) * 100) : 0;
              return (
                <div key={g.group} className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full" style={{ background: GROUP_COLORS[g.group] }} />
                  <span className="flex-1 text-sm">{g.group}</span>
                  <span className="text-sm tabular-nums">{show(g.valueMinor)}</span>
                  <span className="w-10 text-right text-xs text-muted-foreground">{pct}%</span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>By member &amp; entity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {nw.byOwner.map((o) => (
              <div key={o.ownerId} className="flex items-center gap-3">
                <span className="flex-1 text-sm">{o.ownerName}</span>
                <span className="text-sm tabular-nums">{show(o.netMinor)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>All holdings</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search holdings"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {typeOptions.map((o) => (
              <button
                key={o.key}
                type="button"
                onClick={() => setTypeFilter(o.key)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  typeFilter === o.key
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                {o.label} <span className="opacity-70">{o.count}</span>
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {visibleItems.map((it) => (
              <div key={`${it.kind}:${it.id}`} className="flex items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{it.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {KIND_LABEL[it.kind]}
                    {it.assetClass ? ` · ${ASSET_CLASS_LABELS[it.assetClass]}` : ""}
                    {it.nativeCurrency !== reportingCurrency
                      ? ` · ${formatMoney(it.nativeMinor, it.nativeCurrency)}`
                      : ""}
                  </p>
                </div>
                {it.missingRate && <Badge variant="destructive">No FX rate</Badge>}
                <span className={`text-sm font-semibold tabular-nums ${it.baseMinor < 0 ? "text-destructive" : ""}`}>
                  {show(it.baseMinor)}
                </span>
              </div>
            ))}
            {visibleItems.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {sortedItems.length === 0 ? "No holdings in scope." : "No holdings match this filter."}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
