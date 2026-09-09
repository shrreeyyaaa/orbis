import { InsightsRail } from "@/components/insights-feed";
import { loadScopedInsights } from "@/lib/load-insights";
import type { InsightScope } from "@/lib/insights";

export async function PageInsightsRail({
  scope,
  title,
}: {
  scope: InsightScope;
  title?: string;
}) {
  try {
    const insights = await loadScopedInsights(scope);
    return <InsightsRail insights={insights} scope={scope} title={title} />;
  } catch {
    return null;
  }
}
