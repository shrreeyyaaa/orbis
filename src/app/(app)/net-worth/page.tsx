import { redirect } from "next/navigation";
import { getHouseholdContext } from "@/lib/household";
import { loadPortfolio, loadValuations } from "@/lib/load";
import { NetWorthView } from "./net-worth-view";
import { PageInsightsRail } from "@/components/page-insights-rail";

export default async function NetWorthPage() {
  const ctx = await getHouseholdContext();
  if (!ctx) redirect("/onboarding");

  const [portfolio, valuations] = await Promise.all([
    loadPortfolio(ctx.household.id),
    loadValuations(ctx.household.id),
  ]);

  return (
    <>
      <PageInsightsRail scope="allocation" title="Net worth insights" />
      <NetWorthView owners={ctx.owners} portfolio={portfolio} valuations={valuations} />
    </>
  );
}