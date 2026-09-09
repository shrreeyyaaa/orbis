"use client";
import Link from "next/link";
import { Flame, Trophy, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ACHIEVEMENTS } from "@/lib/achievements";

export function XpStrip({
  earnedCount,
  streakDays,
}: {
  earnedCount: number;
  streakDays: number;
}) {
  const total = ACHIEVEMENTS.length;
  const safe = Math.min(Math.max(earnedCount, 0), total);
  const pct = total > 0 ? Math.round((safe / total) * 100) : 0;
  const xp = safe * 100;

  return (
    <div className="flex items-center gap-3 border-b border-border bg-card/90 px-4 py-2 text-xs lg:px-6">
      <Link
        href="/achievements"
        className="group flex items-center gap-2 rounded-lg px-1.5 py-0.5 transition-colors hover:bg-muted"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gold/15 text-gold">
          <Trophy className="h-3.5 w-3.5" />
        </span>
        <span className="font-mono text-sm font-semibold tabular-nums text-foreground">{xp}</span>
        <span className="text-muted-foreground">XP</span>
        <span className="hidden text-muted-foreground sm:inline">· {safe}/{total}</span>
      </Link>
      <div className="hidden max-w-[14rem] flex-1 sm:block">
        <Progress value={pct} className="h-1.5" indicatorClassName="bg-primary" />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 font-medium text-primary transition-colors hover:bg-primary/15"
        >
          <Flame className={`h-3.5 w-3.5 ${streakDays > 0 ? "" : "opacity-50"}`} />
          {streakDays > 0 ? `${streakDays}d streak` : "Build streak"}
        </Link>
        <Link
          href="/goals"
          className="hidden items-center gap-1 text-muted-foreground hover:text-foreground sm:inline-flex"
        >
          <Zap className="h-3.5 w-3.5 text-primary" />
          Quests
        </Link>
      </div>
    </div>
  );
}
