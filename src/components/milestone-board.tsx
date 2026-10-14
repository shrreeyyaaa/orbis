"use client";
import { useCallback, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ContributionHeatmap } from "@/components/contribution-heatmap";
import { Celebration } from "@/components/celebrate";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Flag, Layers, Shield, Landmark, Globe, Target, TrendingUp, Award, Trophy, RotateCcw, Gift } from "lucide-react";

const STORAGE_KEY = "orbis-milestone-progress";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  flag: Flag,
  layers: Layers,
  shield: Shield,
  landmark: Landmark,
  globe: Globe,
  target: Target,
  "trending-up": TrendingUp,
  award: Award,
};

export interface MilestoneItem {
  key: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
}

function readOverrides(): Record<string, number> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeOverrides(next: Record<string, number>) {
  try {
    if (Object.keys(next).length === 0) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // storage unavailable (private mode); progress simply isn't remembered
  }
}

function levelFor(complete: number): { name: string; next: number | null } {
  if (complete >= 7) return { name: "Steward", next: null };
  if (complete >= 5) return { name: "Prepared", next: 7 };
  if (complete >= 3) return { name: "Organized", next: 5 };
  if (complete >= 1) return { name: "Started", next: 3 };
  return { name: "Foundation", next: 1 };
}

export function MilestoneBoard({ items, activityDays }: { items: MilestoneItem[]; activityDays: string[] }) {
  // Start from the server's view (earned = 100%), then layer on anything the user saved in this browser.
  const [overrides, setOverrides] = useState<Record<string, number>>(() =>
    typeof window === "undefined" ? {} : readOverrides(),
  );

  const progressOf = (item: MilestoneItem) => overrides[item.key] ?? (item.earned ? 100 : 0);

  const { coverage, complete } = useMemo(() => {
    const values = items.map((i) => overrides[i.key] ?? (i.earned ? 100 : 0));
    const total = values.reduce((s, v) => s + v, 0);
    return {
      coverage: items.length ? Math.round(total / items.length) : 0,
      complete: values.filter((v) => v >= 100).length,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, overrides]);

  const lvl = levelFor(complete);

  const [reward, setReward] = useState<{ title: string; all: boolean } | null>(null);
  const [confetti, setConfetti] = useState<string | null>(null);
  const clearConfetti = useCallback(() => setConfetti(null), []);

  function setProgress(key: string, value: number) {
    const item = items.find((i) => i.key === key);
    const before = item ? progressOf(item) : 0;
    const next = { ...overrides, [key]: value };
    if (item && before < 100 && value >= 100) {
      const allDone = items.every((i) => (i.key === key ? value : next[i.key] ?? (i.earned ? 100 : 0)) >= 100);
      setReward({ title: item.title, all: allDone });
      setConfetti("Hamper unlocked!");
    }
    setOverrides(next);
    writeOverrides(next);
  }

  function resetAll() {
    setOverrides({});
    writeOverrides({});
  }

  return (
    <div>
      <Card className="relative mb-6 overflow-hidden">
        <div className="orbit-rule absolute inset-x-0 top-0 h-0.5" />
        <CardContent className="flex flex-wrap items-center gap-4 p-5">
          <div className="rounded-xl bg-gold/15 p-3 text-gold">
            <Trophy className="h-7 w-7" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-serif text-xl font-semibold">{lvl.name}</p>
            <p className="text-sm text-muted-foreground">
              {complete} of {items.length} readiness checks complete
              {lvl.next != null ? ` · next level at ${lvl.next}` : ""}
            </p>
            <Progress value={coverage} indicatorClassName="bg-orbit" className="mt-2 max-w-md" />
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-xs font-medium text-gold">
              <Gift className="h-3.5 w-3.5" /> {complete} {complete === 1 ? "hamper" : "hampers"} unlocked
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="rounded-lg border bg-muted/40 px-4 py-2 text-center">
              <p className="font-mono text-2xl font-semibold tabular-nums text-orbit">{coverage}%</p>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Coverage</p>
            </div>
            <Button variant="ghost" size="sm" onClick={resetAll}>
              <RotateCcw className="h-3.5 w-3.5" /> Reset progress
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6 overflow-hidden">
        <div className="orbit-rule h-0.5" />
        <CardContent className="p-5">
          <p className="mb-3 text-sm font-medium">Household activity record</p>
          <ContributionHeatmap activeDays={activityDays} />
          <p className="mt-2 text-xs text-muted-foreground">
            Days with contributions, planning milestones, or financial events.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((a) => {
          const Icon = ICONS[a.icon] ?? Award;
          const pct = progressOf(a);
          const done = pct >= 100;
          return (
            <Card key={a.key} className="card-hover">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start gap-3">
                  <div className={`rounded-lg p-2.5 ${done ? "bg-gold/15 text-gold" : "bg-gold/10 text-gold/80"}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{a.title}</p>
                      {done ? (
                        <Badge variant="success">Earned</Badge>
                      ) : (
                        <span className="font-mono text-xs tabular-nums text-muted-foreground">{pct}%</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{a.description}</p>
                  </div>
                </div>
                <div className="relative flex h-5 items-center">
                  <Progress value={pct} indicatorClassName={done ? "bg-gold" : "bg-orbit"} className="h-2 w-full" />
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={pct}
                    aria-label={`${a.title} progress`}
                    onChange={(e) => setProgress(a.key, Number(e.target.value))}
                    className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-primary shadow peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-card"
                    style={{ left: `clamp(8px, ${pct}%, calc(100% - 8px))` }}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Celebration title={confetti} description={reward?.title} onDone={clearConfetti} />

      <Dialog open={!!reward} onOpenChange={(o) => !o && setReward(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{reward?.all ? "Every milestone complete!" : "Milestone complete!"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="animate-bounce rounded-2xl bg-gold/15 p-5 text-gold">
              <Gift className="h-12 w-12" />
            </div>
            <p className="font-serif text-xl font-semibold">Your hamper is unlocked</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              {reward?.all
                ? "You completed all of your readiness milestones. Here is your grand hamper."
                : `Nicely done on "${reward?.title}". Here is your hamper.`}
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setReward(null)}>
              <Gift className="h-4 w-4" /> Claim hamper
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
