"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/components/currency-context";
import { formatMoney, getMinorDigits } from "@/lib/currency";
import { lineValueAt } from "@/lib/simulation";
import { Play, Pause, RotateCcw } from "lucide-react";

export interface SimLine {
  name: string;
  color: string;
  valueMinor: number; // reporting-currency minor units, signed
  growthPct: number; // per year
  stepUpPct?: number; // percentage points added to the growth rate each year
}

const YEARS = 10;
const STEP = 0.25;
const MS_PER_YEAR = 900;
const MILESTONES = [1.25, 1.5, 2, 3];

const TOOLTIP_STYLE = {
  borderRadius: 10,
  fontSize: 12,
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--popover))",
  color: "hsl(var(--popover-foreground))",
} as const;

function valueAt(l: SimLine, t: number) {
  return lineValueAt(l, t);
}

function contribAt(monthly: number, annualReturnPct: number, t: number) {
  const months = t * 12;
  const r = annualReturnPct / 100 / 12;
  if (months <= 0 || monthly === 0) return 0;
  if (Math.abs(r) < 1e-9) return monthly * months;
  return monthly * ((Math.pow(1 + r, months) - 1) / r);
}

export function GrowthSimulation({
  lines,
  monthlyMinor,
  contributionReturnPct,
  inflationPct,
}: {
  lines: SimLine[];
  monthlyMinor: number;
  contributionReturnPct: number;
  inflationPct: number;
}) {
  const { displayCurrency, toDisplay, show } = useCurrency();
  const digits = getMinorDigits(displayCurrency);
  const toMajor = (m: number) => toDisplay(m) / 10 ** digits;
  const fmtAxis = (major: number) =>
    formatMoney(Math.round(major * 10 ** digits), displayCurrency, { compact: true });

  const reduced =
    typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const [t, setT] = useState(reduced ? YEARS : 0);
  const [playing, setPlaying] = useState(!reduced);
  const tRef = useRef(reduced ? YEARS : 0);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      const n = Math.min(YEARS, tRef.current + dt / MS_PER_YEAR);
      tRef.current = n;
      setT(n);
      if (n >= YEARS) setPlaying(false);
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const stacked = useMemo(() => lines.filter((l) => l.valueMinor > 0), [lines]);
  const hasContrib = monthlyMinor > 0;

  const totalAt = (x: number) =>
    lines.reduce((s, l) => s + valueAt(l, x), 0) + contribAt(monthlyMinor, contributionReturnPct, x);

  const rowAt = (x: number) => {
    const row: Record<string, number> = { t: Number(x.toFixed(3)) };
    stacked.forEach((l, i) => {
      row[`s${i}`] = toMajor(valueAt(l, x));
    });
    row.contrib = toMajor(contribAt(monthlyMinor, contributionReturnPct, x));
    row.net = toMajor(totalAt(x));
    return row;
  };

  /* eslint-disable react-hooks/exhaustive-deps */
  const rows = useMemo(() => {
    const out: Record<string, number>[] = [];
    for (let x = 0; x <= YEARS + 1e-9; x += STEP) out.push(rowAt(x));
    return out;
  }, [lines, monthlyMinor, contributionReturnPct, toDisplay, displayCurrency]);

  const start = totalAt(0);
  const milestones = useMemo(() => {
    if (start <= 0) return [];
    return MILESTONES.map((m) => {
      for (let x = 0; x <= YEARS + 1e-9; x += 0.05) {
        if (totalAt(x) >= m * start) return { mult: m, year: x };
      }
      return null;
    }).filter(Boolean) as { mult: number; year: number }[];
  }, [lines, monthlyMinor, contributionReturnPct]);

  const yMax = useMemo(
    () => Math.max(1, ...rows.map((r) => Math.max(r.net, stacked.reduce((s, _, i) => s + r[`s${i}`], 0) + r.contrib))) * 1.06,
    [rows, stacked],
  );
  const yMin = useMemo(() => Math.min(0, ...rows.map((r) => r.net)), [rows]);

  const yearly = useMemo(() => {
    const out: { year: number; nominal: number; real: number; change: number | null }[] = [];
    let prev: number | null = null;
    for (let y = 0; y <= YEARS; y++) {
      const nominal = totalAt(y);
      out.push({
        year: y,
        nominal,
        real: nominal / Math.pow(1 + inflationPct / 100, y),
        change: prev && prev > 0 ? (nominal / prev - 1) * 100 : null,
      });
      prev = nominal;
    }
    return out;
  }, [lines, monthlyMinor, contributionReturnPct, inflationPct]);

  const maxEnd = Math.max(
    1,
    ...stacked.map((l) => valueAt(l, YEARS)),
    contribAt(monthlyMinor, contributionReturnPct, YEARS),
  );
  /* eslint-enable react-hooks/exhaustive-deps */

  const total = totalAt(t);
  const real = total / Math.pow(1 + inflationPct / 100, t);
  const gain = total - start;
  const avg = t > 0.05 && start > 0 && total > 0 ? (Math.pow(total / start, 1 / t) - 1) * 100 : null;
  const shown = [...rows.filter((r) => r.t < t - 1e-9), rowAt(t)];
  const done = t >= YEARS - 1e-9;
  const yearNow = Math.min(YEARS, Math.floor(t + 1e-9));

  function replay() {
    tRef.current = 0;
    setT(0);
    setPlaying(true);
  }
  function togglePlay() {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (tRef.current >= YEARS) {
      tRef.current = 0;
      setT(0);
    }
    setPlaying(true);
  }

  return (
    <Card className="overflow-hidden">
      <div className="orbit-rule h-0.5" />
      <CardHeader className="flex-row flex-wrap items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle>{YEARS}-year growth simulation</CardTitle>
          <CardDescription>
            Watch your net worth compound year by year, built from each asset class&apos;s yearly growth rate.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={togglePlay}>
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {playing ? "Pause" : done ? "Play again" : "Play"}
          </Button>
          <Button variant="ghost" size="sm" onClick={replay}>
            <RotateCcw className="h-4 w-4" /> Restart
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Year {yearNow} of {YEARS}
            </p>
            <p className="mt-1 font-serif text-4xl font-semibold tabular-nums tracking-tight">{show(Math.round(total))}</p>
            <p className="mt-1 text-sm text-muted-foreground tabular-nums">
              {show(Math.round(real))} in today&apos;s money
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-lg border bg-muted/40 px-4 py-2">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Gain so far</p>
              <p className={`font-mono text-lg font-semibold tabular-nums ${gain >= 0 ? "text-success" : "text-destructive"}`}>
                {gain >= 0 ? "+" : ""}
                {show(Math.round(gain))}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/40 px-4 py-2">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Growth per year</p>
              <p className="font-mono text-lg font-semibold tabular-nums">{avg == null ? "—" : `${avg.toFixed(1)}%`}</p>
            </div>
          </div>
        </div>

        <div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${(t / YEARS) * 100}%` }} />
          </div>
          <input
            aria-label="Simulation year"
            type="range"
            min={0}
            max={YEARS}
            step={0.05}
            value={t}
            onChange={(e) => {
              const v = Number(e.target.value);
              tRef.current = v;
              setPlaying(false);
              setT(v);
            }}
            className="mt-2 w-full accent-primary"
          />
        </div>

        <ResponsiveContainer width="100%" height={340}>
          <ComposedChart data={shown} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.6} />
            <XAxis
              dataKey="t"
              type="number"
              domain={[0, YEARS]}
              ticks={Array.from({ length: YEARS + 1 }, (_, i) => i)}
              tickFormatter={(v) => `Y${v}`}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              allowDataOverflow
            />
            <YAxis
              domain={[yMin, yMax]}
              allowDataOverflow
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={70}
              tickFormatter={(v) => fmtAxis(v as number)}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              labelFormatter={(v) => `Year ${Number(v).toFixed(1)}`}
              formatter={(v, n) => [fmtAxis(v as number), n as string]}
            />
            {stacked.map((l, i) => (
              <Area
                key={l.name + i}
                name={l.name}
                dataKey={`s${i}`}
                stackId="nw"
                type="monotone"
                stroke="none"
                fill={l.color}
                fillOpacity={0.82}
                isAnimationActive={false}
              />
            ))}
            {hasContrib && (
              <Area
                name="Monthly contributions"
                dataKey="contrib"
                stackId="nw"
                type="monotone"
                stroke="none"
                fill="#C29A4E"
                fillOpacity={0.9}
                isAnimationActive={false}
              />
            )}
            <Line
              name="Net worth"
              dataKey="net"
              type="monotone"
              stroke="hsl(var(--foreground))"
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
        <p className="-mt-3 text-xs text-muted-foreground">
          Coloured layers are your assets by class; the dark line is net worth after liabilities.
        </p>

        {milestones.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {milestones.map((m) => {
              const reached = t >= m.year;
              return (
                <span
                  key={m.mult}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    reached ? "border-success/40 bg-success/10 text-success" : "text-muted-foreground opacity-60"
                  }`}
                >
                  {m.mult}× net worth · year {m.year.toFixed(1)}
                </span>
              );
            })}
          </div>
        )}

        <div>
          <p className="mb-3 text-sm font-medium">Where the growth comes from</p>
          <div className="space-y-2.5">
            {lines.map((l, i) => {
              const v = valueAt(l, t);
              const d = v - l.valueMinor;
              const negative = l.valueMinor < 0;
              return (
                <div key={l.name + i} className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)_auto] items-center gap-3 text-sm">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: l.color }} />
                    <span className="truncate">{l.name}</span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {l.growthPct}%/yr{l.stepUpPct ? ` +${l.stepUpPct}/yr` : ""}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    {!negative && (
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.min(100, (v / maxEnd) * 100)}%`, background: l.color }}
                      />
                    )}
                  </div>
                  <div className="text-right font-mono text-xs tabular-nums">
                    <span>{show(Math.round(v))}</span>
                    {!negative && l.growthPct !== 0 && (
                      <span className={`ml-2 ${d >= 0 ? "text-success" : "text-destructive"}`}>
                        {d >= 0 ? "+" : ""}
                        {show(Math.round(d))}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {hasContrib && (
              <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)_auto] items-center gap-3 text-sm">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: "#C29A4E" }} />
                  <span className="truncate">Monthly contributions</span>
                  <span className="shrink-0 text-[11px] text-muted-foreground">{contributionReturnPct}%/yr</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, (contribAt(monthlyMinor, contributionReturnPct, t) / maxEnd) * 100)}%`,
                      background: "#C29A4E",
                    }}
                  />
                </div>
                <div className="text-right font-mono text-xs tabular-nums">
                  {show(Math.round(contribAt(monthlyMinor, contributionReturnPct, t)))}
                </div>
              </div>
            )}
          </div>
        </div>

        {done && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2">Year</th>
                  <th className="py-2">Net worth</th>
                  <th className="py-2">Today&apos;s money</th>
                  <th className="py-2 text-right">Change on prior year</th>
                </tr>
              </thead>
              <tbody>
                {yearly.map((r) => (
                  <tr key={r.year} className="border-b last:border-0">
                    <td className="py-1.5">{r.year === 0 ? "Today" : `Year ${r.year}`}</td>
                    <td className="py-1.5 tabular-nums">{show(Math.round(r.nominal))}</td>
                    <td className="py-1.5 tabular-nums text-muted-foreground">{show(Math.round(r.real))}</td>
                    <td className={`py-1.5 text-right tabular-nums ${r.change != null && r.change < 0 ? "text-destructive" : "text-success"}`}>
                      {r.change == null ? "—" : `${r.change >= 0 ? "+" : ""}${r.change.toFixed(1)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Hypothetical projection using steady yearly growth rates and {inflationPct}% yearly inflation. Not a
          prediction or guarantee.
        </p>
      </CardContent>
    </Card>
  );
}
