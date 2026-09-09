"use client";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Reveal } from "@/components/motion/reveal";
import type { Insight, InsightScope, InsightSeverity } from "@/lib/insights";
import {
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

const META: Record<
  InsightSeverity,
  { icon: React.ComponentType<{ className?: string }>; tone: string; ring: string }
> = {
  critical: { icon: AlertOctagon, tone: "text-destructive", ring: "bg-destructive/10" },
  warn: { icon: AlertTriangle, tone: "text-amber-600 dark:text-amber-400", ring: "bg-amber-500/10" },
  info: { icon: Info, tone: "text-primary", ring: "bg-primary/10" },
  positive: { icon: CheckCircle2, tone: "text-success", ring: "bg-success/10" },
};

export function InsightsFeed({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-12 text-center">
          <CheckCircle2 className="mb-3 h-9 w-9 text-success" />
          <p className="font-medium">Nothing needs your attention</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add more of your finances to surface tailored insights.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {insights.map((it, i) => {
        const m = META[it.severity];
        const Icon = m.icon;
        return (
          <Reveal key={it.id} delay={Math.min(i * 0.04, 0.3)}>
            <Card className="card-hover">
              <CardContent className="flex items-start gap-3 p-4">
                <div className={`mt-0.5 rounded-lg p-2 ${m.ring}`}>
                  <Icon className={`h-5 w-5 ${m.tone}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{it.title}</p>
                    <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      {it.category}
                    </span>
                  </div>
                  <p className="privacy-sensitive mt-0.5 text-sm text-muted-foreground">{it.detail}</p>
                  {it.href && (
                    <Link
                      href={it.href}
                      className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                    >
                      {it.actionLabel ?? "View"}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          </Reveal>
        );
      })}
    </div>
  );
}

/** Compact actionable list for the dashboard. */
export function InsightsMini({ insights, className = "" }: { insights: Insight[]; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {insights.map((it) => {
        const m = META[it.severity];
        const Icon = m.icon;
        return (
          <div
            key={it.id}
            className="group rounded-xl border border-border/60 bg-muted/40 p-3 transition-colors hover:border-primary/30 hover:bg-accent/60"
          >
            <div className="flex items-start gap-2.5">
              <span className={`mt-0.5 rounded-md p-1.5 ${m.ring}`}>
                <Icon className={`h-3.5 w-3.5 ${m.tone}`} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-tight">{it.title}</p>
                <p className="privacy-sensitive mt-0.5 line-clamp-2 text-xs text-muted-foreground">{it.detail}</p>
                {it.href && (
                  <Link
                    href={it.href}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    {it.actionLabel ?? "Take action"}
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Compact rail for every dashboard page. */
export function InsightsRail({
  insights,
  scope = "all",
  title = "Insights",
  limit = 3,
}: {
  insights: Insight[];
  scope?: InsightScope;
  title?: string;
  limit?: number;
}) {
  const top = insights.slice(0, limit);
  const lead = top[0];
  if (!lead) return null;
  const meta = META[lead.severity];
  const LeadIcon = meta.icon;

  return (
    <aside aria-label={title} className="mb-5 flex items-center gap-3 rounded-xl border border-border/70 bg-card/65 px-3 py-2.5">
      <span className={`shrink-0 rounded-lg p-2 ${meta.ring}`}><LeadIcon className={`h-4 w-4 ${meta.tone}`} aria-hidden /></span>
      <div className="min-w-0 flex-1 sm:flex sm:items-baseline sm:gap-3">
        <p className="shrink-0 text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{title}</p>
        <p className="truncate text-sm font-medium">{lead.title}</p>
        <p className="privacy-sensitive hidden min-w-0 flex-1 truncate text-xs text-muted-foreground xl:block">{lead.detail}</p>
      </div>
      {top.length > 1 && <span className="shrink-0 rounded-full bg-muted px-2 py-1 font-mono text-[10px] text-muted-foreground">+{top.length - 1}</span>}
      <Link href={`/insights?scope=${scope}`} className="shrink-0 text-xs font-semibold text-primary hover:underline">Review</Link>
    </aside>
  );
}
