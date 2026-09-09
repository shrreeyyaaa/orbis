import Link from "next/link";
import { redirect } from "next/navigation";
import { LineChart, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getHouseholdContext } from "@/lib/household";
import { LandingHero } from "@/components/landing-hero";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const ctx = await getHouseholdContext();
    if (!ctx) redirect("/onboarding");
    redirect("/dashboard");
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070b14] text-[#f2f5f8]">
      <LandingHero />
      <header className="relative z-10 flex items-center justify-between px-6 py-5 lg:px-10">
        <div className="flex items-center gap-2">
          <LineChart className="h-5 w-5 text-emerald-400" />
          <span className="font-serif text-xl font-semibold tracking-tight">Orbis</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-white/55 transition-colors hover:text-white"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-[#04120c] shadow-[0_12px_40px_-12px_rgba(16,185,129,0.7)] transition-transform active:translate-y-px hover:bg-emerald-400"
          >
            Get started
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex min-h-[calc(100vh-5rem)] flex-col justify-center px-6 pb-16 pt-8 lg:px-10">
        <div className="max-w-xl">
          <p className="font-serif text-6xl font-medium tracking-tight sm:text-7xl">Orbis</p>
          <h1 className="mt-4 text-2xl font-medium leading-snug text-white/90 sm:text-3xl">
            Watch the money move.
            <br />
            <span className="text-emerald-400">Then make it count.</span>
          </h1>
          <p className="mt-4 max-w-md text-base text-white/50 sm:text-lg">
            Family net worth, goals funded by income, and a dashboard that feels alive.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link
              href="/login"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-emerald-500 px-7 text-sm font-semibold text-[#04120c] shadow-[0_16px_50px_-12px_rgba(16,185,129,0.75)] transition-transform active:translate-y-0.5 hover:bg-emerald-400"
            >
              Open dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-12 items-center rounded-xl border border-white/12 bg-white/[0.04] px-7 text-sm font-medium text-white/80 transition-colors hover:bg-white/[0.08]"
            >
              Create account
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
