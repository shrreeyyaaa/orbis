import { redirect } from "next/navigation";
import { getHouseholdContext } from "@/lib/household";
import { createClient } from "@/lib/supabase/server";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { PageHeader } from "@/components/ui-bits";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ContributionHeatmap } from "@/components/contribution-heatmap";
import {
  Flag,
  Layers,
  Shield,
  Landmark,
  Globe,
  Target,
  TrendingUp,
  Award,
  Trophy,
  Lock,
} from "lucide-react";

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

function level(count: number): { name: string; next: number } {
  if (count >= 7) return { name: "Steward", next: 7 };
  if (count >= 5) return { name: "Prepared", next: 7 };
  if (count >= 3) return { name: "Organized", next: 5 };
  if (count >= 1) return { name: "Started", next: 3 };
  return { name: "Foundation", next: 1 };
}

export default async function AchievementsPage() {
  const ctx = await getHouseholdContext();
  if (!ctx) redirect("/onboarding");

  const supabase = await createClient();
  const hid = ctx.household.id;
  const [achRes, eventsRes] = await Promise.all([
    supabase.from("achievements").select("key, earned_at").eq("household_id", hid),
    supabase
      .from("financial_events")
      .select("occurred_on")
      .eq("household_id", hid)
      .order("occurred_on", { ascending: false })
      .limit(120),
  ]);

  const earnedAt = new Map(
    (achRes.data ?? []).map((a: { key: string; earned_at: string }) => [a.key, a.earned_at]),
  );
  const earnedCount = ACHIEVEMENTS.filter((achievement) => earnedAt.has(achievement.key)).length;
  const lvl = level(earnedCount);
  const activityDays = ((eventsRes.data ?? []) as { occurred_on: string }[]).map(
    (e) => e.occurred_on.slice(0, 10),
  );

  return (
    <div>
      <PageHeader
        title="Stewardship"
        description="Readiness milestones for maintaining a complete and resilient family wealth picture."
      />

      <Card className="relative mb-6 overflow-hidden">
        <div className="orbit-rule absolute inset-x-0 top-0 h-0.5" />
        <CardContent className="flex flex-wrap items-center gap-4 p-5">
          <div className="rounded-xl bg-gold/15 p-3 text-gold">
            <Trophy className="h-7 w-7" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-serif text-xl font-semibold">{lvl.name}</p>
            <p className="text-sm text-muted-foreground">
              {earnedCount} of {ACHIEVEMENTS.length} readiness checks complete
              {earnedCount < ACHIEVEMENTS.length ? ` · next level at ${lvl.next}` : ""}
            </p>
            <Progress
              value={Math.round((earnedCount / ACHIEVEMENTS.length) * 100)}
              indicatorClassName="bg-orbit"
              className="mt-2 max-w-md"
            />
          </div>
          <div className="rounded-lg border bg-muted/40 px-4 py-2 text-center">
            <p className="font-mono text-2xl font-semibold tabular-nums text-orbit">{Math.round((earnedCount / ACHIEVEMENTS.length) * 100)}%</p>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Coverage</p>
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
        {ACHIEVEMENTS.map((a) => {
          const Icon = ICONS[a.icon] ?? Award;
          const earned = earnedAt.has(a.key);
          return (
            <Card key={a.key} className={`card-hover ${earned ? "" : "opacity-60"}`}>
              <CardContent className="flex items-start gap-3 p-4">
                <div
                  className={`rounded-lg p-2.5 ${
                    earned ? "bg-gold/15 text-gold" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {earned ? <Icon className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{a.title}</p>
                    {earned && <Badge variant="success">Earned</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{a.description}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
