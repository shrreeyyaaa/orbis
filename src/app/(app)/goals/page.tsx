import { redirect } from "next/navigation";
import { getHouseholdContext } from "@/lib/household";
import { createClient } from "@/lib/supabase/server";
import { GoalsView } from "./goals-view";
import { PageInsightsRail } from "@/components/page-insights-rail";
import type { Goal, GoalIncomeAllocation, IncomeSource } from "@/lib/types";

export default async function GoalsPage() {
  const ctx = await getHouseholdContext();
  if (!ctx) redirect("/onboarding");

  const supabase = await createClient();
  const hid = ctx.household.id;
  const [goals, income, allocs] = await Promise.all([
    supabase.from("goals").select("*").eq("household_id", hid).order("priority").order("target_date"),
    supabase.from("income_sources").select("*").eq("household_id", hid),
    supabase.from("goal_income_allocations").select("*").eq("household_id", hid),
  ]);

  return (
    <>
      <PageInsightsRail scope="goals" title="Goal insights" />
      <GoalsView
        householdId={hid}
        owners={ctx.owners}
        goals={(goals.data ?? []) as Goal[]}
        incomeSources={(income.data ?? []) as IncomeSource[]}
        allocations={(allocs.data ?? []) as GoalIncomeAllocation[]}
      />
    </>
  );
}
