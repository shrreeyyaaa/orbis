"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CalendarDays,
  CircleDollarSign,
  Eye,
  EyeOff,
  FlaskConical,
  LayoutDashboard,
  Lightbulb,
  LineChart,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { ExchangeRate, Household, Owner } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ScopeProvider, ScopePicker } from "@/components/scope-context";
import { CurrencyProvider } from "@/components/currency-context";
import { CurrencyToggle } from "@/components/currency-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { CommandPalette, OPEN_COMMAND_EVENT } from "@/components/command-palette";
import { QuickAdd } from "@/components/quick-add";
import { AssistantPanel, OPEN_ASSISTANT_EVENT } from "@/components/assistant/assistant-panel";
import { PageEnter } from "@/components/motion/reveal";
import { HookSidebar } from "@/components/hook-sidebar";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavSection = NavItem & {
  matches: string[];
  children: NavItem[];
};

const sections: NavSection[] = [
  {
    href: "/dashboard",
    label: "Today",
    icon: LayoutDashboard,
    matches: ["/dashboard", "/events"],
    children: [
      { href: "/dashboard", label: "Morning brief", icon: LayoutDashboard },
      { href: "/events", label: "Activity ledger", icon: CalendarDays },
    ],
  },
  {
    href: "/net-worth",
    label: "Wealth",
    icon: LineChart,
    matches: ["/net-worth", "/accounts", "/investments", "/assets", "/liabilities"],
    children: [
      { href: "/net-worth", label: "Wealth overview", icon: LineChart },
      { href: "/accounts", label: "Accounts", icon: Wallet },
      { href: "/investments", label: "Investments", icon: LineChart },
      { href: "/assets", label: "Private assets", icon: Wallet },
      { href: "/liabilities", label: "Liabilities", icon: CircleDollarSign },
    ],
  },
  {
    href: "/cashflow",
    label: "Cash",
    icon: CircleDollarSign,
    matches: ["/cashflow"],
    children: [
      { href: "/cashflow?view=income", label: "Income", icon: CircleDollarSign },
      { href: "/cashflow?view=expenses", label: "Spending", icon: CircleDollarSign },
    ],
  },
  {
    href: "/goals",
    label: "Plan",
    icon: Target,
    matches: ["/goals", "/simulate"],
    children: [
      { href: "/goals", label: "Goals", icon: Target },
      { href: "/simulate", label: "Decision room", icon: FlaskConical },
    ],
  },
  {
    href: "/family",
    label: "Family",
    icon: Users,
    matches: ["/family"],
    children: [{ href: "/family", label: "People & entities", icon: Users }],
  },
  {
    href: "/insights",
    label: "Insights",
    icon: Lightbulb,
    matches: ["/insights", "/achievements"],
    children: [
      { href: "/insights", label: "Action desk", icon: Lightbulb },
      { href: "/achievements", label: "Stewardship", icon: Trophy },
    ],
  },
];

const bottomSections = sections.slice(0, 4);

function pathMatches(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

export function AppShell({
  household,
  owners,
  exchangeRates,
  displayCurrency,
  userEmail,
  demoMode = false,
  children,
}: {
  household: Household;
  owners: Owner[];
  exchangeRates: ExchangeRate[];
  displayCurrency: string | null;
  userEmail: string;
  demoMode?: boolean;
  children: React.ReactNode;
  earnedCount?: number;
  streakDays?: number;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(false);

  useEffect(() => {
    setPrivacyMode(localStorage.getItem("orbis.privacy-mode") === "true");
  }, []);

  function togglePrivacy() {
    setPrivacyMode((current) => {
      const next = !current;
      localStorage.setItem("orbis.privacy-mode", String(next));
      return next;
    });
  }

  async function onLogout() {
    document.cookie = "orbis_demo_logged_in=false; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const activeSection = sections.find((section) =>
    section.matches.some((route) => pathMatches(pathname, route)),
  );

  const childIsActive = (href: string) => {
    const [route, query] = href.split("?");
    if (!pathMatches(pathname, route)) return false;
    if (!query) return true;
    const expected = new URLSearchParams(query).get("view");
    return expected === (searchParams.get("view") ?? "income");
  };

  return (
    <ScopeProvider owners={owners}>
      <CurrencyProvider
        reportingCurrency={household.reporting_currency}
        exchangeRates={exchangeRates}
        initialDisplayCurrency={displayCurrency}
      >
        <a
          href="#main-content"
          className="fixed left-3 top-3 z-[100] -translate-y-20 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg focus:translate-y-0"
        >
          Skip to content
        </a>

        <div className={`${privacyMode ? "privacy-mode" : ""} flex min-h-screen bg-background text-foreground`}>
          <aside className="sticky top-0 hidden h-screen w-[16.5rem] shrink-0 flex-col overflow-hidden border-r border-border/80 bg-card/95 lg:flex">
            <div aria-hidden className="pointer-events-none absolute inset-0 opacity-70" style={{ background: "radial-gradient(80% 36% at 12% 0%, hsl(var(--orbit) / .16), transparent 70%)" }} />
            <Link href="/dashboard" className="relative flex h-[4.25rem] items-center gap-3 border-b border-border/70 px-5">
              <span className="relative flex h-9 w-9 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
                <span className="absolute inset-1 rounded-full border border-primary/20" />
                <LineChart className="h-4 w-4 text-primary" aria-hidden />
              </span>
              <span>
                <span className="block font-serif text-xl font-semibold tracking-tight">Orbis</span>
                <span className="block text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Living wealth atlas</span>
              </span>
            </Link>

            <nav aria-label="Primary" className="relative flex-1 overflow-y-auto px-3 py-5">
              <p className="mb-3 px-3 text-[9px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Family office</p>
              <div className="space-y-1">
                {sections.map((section) => {
                  const Icon = section.icon;
                  const active = activeSection?.label === section.label;
                  return (
                    <div key={section.label}>
                      <Link
                        href={section.href}
                        aria-current={active ? "page" : undefined}
                        className={`relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm transition-colors ${
                          active
                            ? "bg-primary/10 font-semibold text-foreground"
                            : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                        }`}
                      >
                        {active && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-primary" />}
                        <Icon className={`h-4 w-4 ${active ? "text-primary" : ""}`} aria-hidden />
                        {section.label}
                      </Link>

                      {active && section.children.length > 0 && (
                        <HookSidebar
                          items={section.children}
                          activeIndex={section.children.findIndex((item) => childIsActive(item.href))}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </nav>

            <div className="relative border-t border-border/70 p-3">
              <div className="mb-3 rounded-xl border border-border/70 bg-background/50 p-3">
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden />
                  Data status
                </div>
                <p className="mt-2 text-xs font-medium">{demoMode ? "Local demo workspace" : "Connected workspace"}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {demoMode ? "Sample data · changes are not durable" : "Household data · private view"}
                </p>
              </div>
              <div className="flex items-center gap-2 px-1">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{household.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{userEmail}</p>
                </div>
                <Link href="/settings" aria-label="Settings" title="Settings" className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
                  <Settings className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="sticky top-0 z-30 border-b border-border/70 bg-background/88 backdrop-blur-xl">
              <header className="flex h-14 items-center gap-2 px-3 lg:px-7">
                <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
                    <LineChart className="h-3.5 w-3.5 text-primary" aria-hidden />
                  </span>
                  <span className="hidden font-serif text-lg font-semibold min-[360px]:inline">Orbis</span>
                </Link>

                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new Event(OPEN_COMMAND_EVENT))}
                  className="hidden min-w-52 items-center gap-2 rounded-xl border border-border bg-card/80 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:flex"
                >
                  <Search className="h-4 w-4" aria-hidden />
                  Search anything
                  <kbd className="ml-auto rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium">⌘K</kbd>
                </button>

                <div className="ml-auto flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="sm:hidden"
                    aria-label="Search"
                    onClick={() => window.dispatchEvent(new Event(OPEN_COMMAND_EVENT))}
                  >
                    <Search className="h-4 w-4" aria-hidden />
                  </Button>
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new Event(OPEN_ASSISTANT_EVENT))}
                    className="hidden items-center gap-1.5 rounded-xl border border-primary/25 bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/15 md:flex"
                  >
                    <Sparkles className="h-4 w-4" aria-hidden />
                    Ask Orbis
                  </button>
                  <QuickAdd />
                  <ThemeToggle className="hidden xl:inline-flex" />
                  <Button variant="ghost" size="icon" onClick={onLogout} title="Log out" aria-label="Log out">
                    <LogOut className="h-4 w-4" aria-hidden />
                  </Button>
                </div>
              </header>

              <div
                aria-label="Current data view"
                className="grid min-h-11 grid-cols-[minmax(0,1fr)_5.25rem_2.25rem] items-center gap-1.5 border-t border-border/50 px-2 py-1.5 sm:flex sm:h-11 sm:gap-2 sm:px-3 sm:py-0 lg:px-7"
              >
                <span className="hidden shrink-0 text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:inline">Viewing</span>
                <ScopePicker className="min-w-0 w-full sm:w-[170px] sm:shrink-0" />
                <CurrencyToggle className="min-w-0 w-full sm:w-[88px] sm:shrink-0" />
                <span className="hidden shrink-0 rounded-lg border border-border bg-card/70 px-2.5 py-1.5 text-[11px] text-muted-foreground md:inline">Latest records</span>
                {demoMode && <span className="hidden shrink-0 rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-gold md:inline">Demo</span>}
                <button
                  type="button"
                  onClick={togglePrivacy}
                  aria-pressed={privacyMode}
                  aria-label={privacyMode ? "Reveal values" : "Enable privacy mode"}
                  title={privacyMode ? "Reveal values" : "Privacy mode"}
                  className="inline-flex h-8 w-9 shrink-0 items-center justify-center gap-1.5 rounded-lg text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground sm:ml-auto sm:w-auto sm:px-2.5"
                >
                  {privacyMode ? <EyeOff className="h-3.5 w-3.5" aria-hidden /> : <Eye className="h-3.5 w-3.5" aria-hidden />}
                  <span className="sr-only sm:not-sr-only">{privacyMode ? "Reveal values" : "Privacy mode"}</span>
                </button>
              </div>
            </div>

            <main id="main-content" tabIndex={-1} className="relative flex-1 px-4 py-6 pb-24 outline-none lg:px-8 lg:pb-8">
              <div aria-hidden className="pointer-events-none absolute inset-0 -z-10" style={{ background: "radial-gradient(65% 40% at 88% 0%, hsl(var(--orbit) / 0.075), transparent 62%)" }} />
              <PageEnter>{children}</PageEnter>
            </main>

            <nav aria-label="Mobile primary" className="fixed inset-x-0 bottom-0 z-40 grid h-16 grid-cols-5 border-t border-border bg-card/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
              {bottomSections.map((section) => {
                const Icon = section.icon;
                const active = activeSection?.label === section.label;
                return (
                  <Link key={section.href} href={section.href} aria-current={active ? "page" : undefined} className={`flex flex-col items-center justify-center gap-1 text-[10px] font-medium ${active ? "text-primary" : "text-muted-foreground"}`}>
                    <Icon className="h-4 w-4" aria-hidden />
                    {section.label}
                  </Link>
                );
              })}
              <button type="button" aria-expanded={mobileOpen} aria-label="More navigation" onClick={() => setMobileOpen((open) => !open)} className={`flex flex-col items-center justify-center gap-1 text-[10px] font-medium ${mobileOpen || ["Family", "Insights"].includes(activeSection?.label ?? "") ? "text-primary" : "text-muted-foreground"}`}>
                {mobileOpen ? <X className="h-4 w-4" aria-hidden /> : <Menu className="h-4 w-4" aria-hidden />}
                More
              </button>
            </nav>

            {mobileOpen && (
              <div className="fixed inset-0 z-[35] bg-background/55 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)}>
                <nav aria-label="More" className="absolute inset-x-3 bottom-20 max-h-[70vh] overflow-y-auto rounded-2xl border border-border bg-card p-3 shadow-2xl" onClick={(event) => event.stopPropagation()}>
                  <div className="mb-2 flex items-center justify-between px-2 py-1">
                    <p className="font-serif text-lg font-semibold">Explore Orbis</p>
                    <Button variant="ghost" size="icon" aria-label="Close menu" onClick={() => setMobileOpen(false)}><X className="h-4 w-4" /></Button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {sections.map((section) => (
                      <div key={section.label} className="rounded-xl border border-border/70 bg-background/35 p-2">
                        <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{section.label}</p>
                        {section.children.map((item) => (
                          <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className="block rounded-lg px-2 py-2 text-sm hover:bg-muted">{item.label}</Link>
                        ))}
                      </div>
                    ))}
                  </div>
                  <Link href="/settings" onClick={() => setMobileOpen(false)} className="mt-2 flex items-center gap-2 rounded-xl border border-border/70 px-3 py-3 text-sm font-medium"><Settings className="h-4 w-4" /> Settings</Link>
                </nav>
              </div>
            )}

            <CommandPalette />
            <AssistantPanel />
          </div>
        </div>
      </CurrencyProvider>
    </ScopeProvider>
  );
}
