"use client";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { AnimatedNumber } from "@/components/motion/animated-number";
import { ArrowUpRight, ArrowDownRight, CheckCircle2, Clock3, ShieldCheck } from "lucide-react";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Good evening";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function NetWorthHero({
  householdName,
  numericValue,
  format,
  deltaLabel,
  positive,
  spark,
  note,
  asOfLabel,
  coverageLabel,
  stats,
}: {
  householdName: string;
  numericValue: number;
  format: (n: number) => string;
  deltaLabel?: string;
  positive: boolean;
  spark: { value: number }[];
  note?: string;
  asOfLabel?: string;
  coverageLabel?: string;
  stats?: { label: string; value: string; tone?: "default" | "positive" | "negative" }[];
}) {
  return (
    <section aria-labelledby="wealth-summary-title" className="elev relative overflow-hidden rounded-[1.75rem] border border-border/80 bg-card">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(80% 70% at 90% 0%, hsl(var(--orbit) / 0.16), transparent 50%), radial-gradient(60% 50% at 0% 100%, hsl(210 60% 50% / 0.06), transparent 45%)",
        }}
      />
      <div className="orbit-rule absolute inset-x-0 top-0 h-0.5" />
      <div className="relative p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">
              {greeting()} · <span className="font-medium text-foreground">{householdName}</span>
            </p>
            <p id="wealth-summary-title" className="mt-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
              Total net worth
            </p>
            <AnimatedNumber
              value={numericValue}
              format={format}
              duration={1.2}
              className="mt-1 block font-mono text-4xl font-semibold tracking-tight tabular-nums text-foreground sm:text-6xl"
            />
            {deltaLabel && (
              <p
                className={`privacy-sensitive mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm tabular-nums ${
                  positive
                    ? "bg-success/15 text-success"
                    : "bg-destructive/15 text-destructive"
                }`}
              >
                {positive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                {deltaLabel}
              </p>
            )}
            {note && <p className="mt-2 text-xs text-muted-foreground">{note}</p>}
            {(asOfLabel || coverageLabel) && (
              <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                {asOfLabel && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/45 px-2.5 py-1">
                    <Clock3 className="h-3 w-3" aria-hidden />
                    {asOfLabel}
                  </span>
                )}
                {coverageLabel && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/45 px-2.5 py-1">
                    <CheckCircle2 className="h-3 w-3 text-primary" aria-hidden />
                    {coverageLabel}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/45 px-2.5 py-1">
                  <ShieldCheck className="h-3 w-3 text-gold" aria-hidden />
                  Private household view
                </span>
              </div>
            )}
          </div>

          {spark.length >= 2 && (
            <div className="h-28 w-full max-w-sm shrink-0 sm:w-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={spark} margin={{ top: 6, bottom: 6, left: 0, right: 0 }}>
                  <defs>
                    <linearGradient id="heroSpark" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--orbit))" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="hsl(var(--orbit))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--orbit))"
                    strokeWidth={2.5}
                    fill="url(#heroSpark)"
                    isAnimationActive
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {stats && stats.length > 0 && (
          <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="bg-card px-4 py-3.5">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </p>
                <p
                  className={`mt-1 truncate font-mono text-sm font-semibold tabular-nums sm:text-base ${
                    s.tone === "positive"
                      ? "text-success"
                      : s.tone === "negative"
                        ? "text-destructive"
                        : "text-foreground"
                  }`}
                >
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
