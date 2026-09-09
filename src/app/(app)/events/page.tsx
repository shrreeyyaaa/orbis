import { redirect } from "next/navigation";
import { getHouseholdContext } from "@/lib/household";
import { createClient } from "@/lib/supabase/server";
import { EventsView } from "./events-view";
import type { FinancialEvent, Goal } from "@/lib/types";

export default async function EventsPage() {
  const ctx = await getHouseholdContext();
  if (!ctx) redirect("/onboarding");

  const supabase = await createClient();
  const hid = ctx.household.id;
  const [events, goals] = await Promise.all([
    supabase
      .from("financial_events")
      .select("*")
      .eq("household_id", hid)
      .order("occurred_on", { ascending: false })
      .limit(50),
    supabase.from("goals").select("*").eq("household_id", hid),
  ]);

  return (
    <EventsView
      householdId={hid}
      events={(events.data ?? []) as FinancialEvent[]}
      goals={(goals.data ?? []) as Goal[]}
    />
  );
}
