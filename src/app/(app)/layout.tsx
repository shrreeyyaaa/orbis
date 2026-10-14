import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getHouseholdContext } from "@/lib/household";
import { AppShell } from "@/components/app-shell";
import type { ExchangeRate } from "@/lib/types";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getHouseholdContext();
  if (!ctx) redirect("/onboarding");

  const supabase = await createClient();
  const hid = ctx.household.id;
  const ratesRes = await supabase.from("exchange_rates").select("*").eq("household_id", hid);

  return (
    <AppShell
      household={ctx.household}
      owners={ctx.owners}
      exchangeRates={(ratesRes.data ?? []) as ExchangeRate[]}
      displayCurrency={ctx.member.display_currency}
      userEmail={ctx.userEmail}
    >
      {children}
    </AppShell>
  );
}
