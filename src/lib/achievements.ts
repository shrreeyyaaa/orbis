// Achievement definitions tied to real financial actions/milestones. The UI
// maps `icon` strings to components so this stays framework-agnostic.

export interface AchievementDef {
  key: string;
  title: string;
  description: string;
  icon: string;
  category: "setup" | "milestone" | "habit";
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { key: "foundation", title: "Foundation mapped", description: "At least one financial account is documented.", icon: "flag", category: "setup" },
  { key: "diversified", title: "Diversification reviewed", description: "The household is represented across four or more asset classes.", icon: "layers", category: "milestone" },
  { key: "safety_net", title: "Liquidity reserve funded", description: "The household emergency reserve is fully funded.", icon: "shield", category: "milestone" },
  { key: "estate_minded", title: "Entity structure mapped", description: "A trust or company is represented in the ownership picture.", icon: "landmark", category: "setup" },
  { key: "global_citizen", title: "Currency exposure recorded", description: "Assets or obligations in multiple currencies are documented.", icon: "globe", category: "milestone" },
  { key: "goal_setter", title: "Planning priorities set", description: "Three or more household goals have been documented.", icon: "target", category: "setup" },
  { key: "in_the_black", title: "Positive cash plan", description: "Expected annual income currently exceeds recorded outflow.", icon: "trending-up", category: "habit" },
];

export const ACHIEVEMENTS_BY_KEY: Record<string, AchievementDef> = Object.fromEntries(
  ACHIEVEMENTS.map((a) => [a.key, a]),
);

export interface AchievementContext {
  accountCount: number;
  assetGroupCount: number;
  hasTrustOrLlc: boolean;
  currencyCount: number;
  goalCount: number;
  emergencyFunded: boolean;
  positiveCashFlow: boolean;
  /** net worth in reporting-currency MAJOR units (e.g. dollars) */
  netWorthMajor: number;
}

/** Returns the set of achievement keys currently earned given the context. */
export function evaluateAchievements(ctx: AchievementContext): string[] {
  const earned: string[] = [];
  if (ctx.accountCount > 0) earned.push("foundation");
  if (ctx.assetGroupCount >= 4) earned.push("diversified");
  if (ctx.emergencyFunded) earned.push("safety_net");
  if (ctx.hasTrustOrLlc) earned.push("estate_minded");
  if (ctx.currencyCount >= 2) earned.push("global_citizen");
  if (ctx.goalCount >= 3) earned.push("goal_setter");
  if (ctx.positiveCashFlow) earned.push("in_the_black");
  return earned;
}
