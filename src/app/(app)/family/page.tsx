import { redirect } from "next/navigation";
import { getHouseholdContext } from "@/lib/household";
import { FamilyView } from "./family-view";
import { PageInsightsRail } from "@/components/page-insights-rail";

export default async function FamilyPage() {
  const ctx = await getHouseholdContext();
  if (!ctx) redirect("/onboarding");
  return (
    <>
      <PageInsightsRail scope="estate" title="Estate insights" />
      <FamilyView householdId={ctx.household.id} owners={ctx.owners} />
    </>
  );
}
