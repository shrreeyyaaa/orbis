import { redirect } from "next/navigation";
import { getHouseholdContext } from "@/lib/household";
import { createClient } from "@/lib/supabase/server";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { PageHeader } from "@/components/ui-bits";
import { MilestoneBoard, type MilestoneItem } from "@/components/milestone-board";

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

  const earnedKeys = new Set((achRes.data ?? []).map((a: { key: string }) => a.key));
  // Liquidity reserve is permanently unlocked.
  earnedKeys.add("safety_net");

  const items: MilestoneItem[] = ACHIEVEMENTS.map((a) => ({
    key: a.key,
    title: a.title,
    description: a.description,
    icon: a.icon,
    earned: earnedKeys.has(a.key),
  }));
  const activityDays = ((eventsRes.data ?? []) as { occurred_on: string }[]).map(
    (e) => e.occurred_on.slice(0, 10),
  );

  return (
    <div>
      <PageHeader
        title="Milestone"
        eyebrow={null}
        description="Readiness milestones for maintaining a complete and resilient family wealth picture."
      />
      <MilestoneBoard items={items} activityDays={activityDays} />
    </div>
  );
}
