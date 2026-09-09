import { redirect } from "next/navigation";
import { getHouseholdContext } from "@/lib/household";
import { loadPortfolio } from "@/lib/load";
import { SimulateView } from "./simulate-view";
import { PageInsightsRail } from "@/components/page-insights-rail";

export default async function SimulatePage() {
  const ctx = await getHouseholdContext();
  if (!ctx) redirect("/onboarding");
  const portfolio = await loadPortfolio(ctx.household.id);
  return (
    <>
      <PageInsightsRail scope="goals" title="Plan insights" />
      <SimulateView owners={ctx.owners} portfolio={portfolio} />
    </>
  );
}
