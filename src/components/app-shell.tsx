"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
import {
  LayoutDashboard,
  Wallet,
  TrendingUp,
  Landmark,
  CreditCard,
  CircleDollarSign,
  ReceiptText,
  Target,
  FlaskConical,
  Trophy,
  Users,
  Settings,
  LogOut,
  LineChart,
  Menu,
  X,
  Search,
  Lightbulb,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/net-worth", label: "Net Worth", icon: LineChart },
  { href: "/insights", label: "Insights", icon: Lightbulb },
  { href: "/accounts", label: "Accounts", icon: Wallet },
  { href: "/investments", label: "Investments", icon: TrendingUp },
  { href: "/assets", label: "Assets", icon: Landmark },
  { href: "/liabilities", label: "Liabilities", icon: CreditCard },
  { href: "/cashflow?view=income", label: "Income", icon: CircleDollarSign, cashflowView: "income" },
  { href: "/cashflow?view=expenses", label: "Expenses", icon: ReceiptText, cashflowView: "expenses" },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/simulate", label: "Simulate", icon: FlaskConical },
  { href: "/achievements", label: "Achievements", icon: Trophy },
  { href: "/family", label: "Family", icon: Users },
];

export function AppShell({
  household,
  owners,
  exchangeRates,
  displayCurrency,
  userEmail,
  children,
}: {
  household: Household;
  owners: Owner[];
  exchangeRates: ExchangeRate[];
  displayCurrency: string | null;
  userEmail: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function onLogout() {
    document.cookie = "orbis_demo_logged_in=false; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <ScopeProvider owners={owners}>
      <CurrencyProvider
        reportingCurrency={household.reporting_currency}
        exchangeRates={exchangeRates}
        initialDisplayCurrency={displayCurrency}
      >
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r bg-card lg:flex">
            <Link href="/dashboard" className="flex h-14 items-center gap-2 border-b px-5">
              <LineChart className="h-5 w-5 text-gold" />
              <span className="font-serif text-lg font-semibold tracking-tight">Orbis</span>
            </Link>
            <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
              {nav.map((item) => {
                const Icon = item.icon;
                const active = item.cashflowView
                  ? pathname === "/cashflow" && (searchParams.get("view") ?? "income") === item.cashflowView
                  : pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative flex h-9 items-center gap-3 rounded-md px-3 text-sm transition-colors ${
                      active
                        ? "bg-accent font-medium text-foreground"
                        : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                    }`}
                  >
                    {active && (
                      <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-gold" />
                    )}
                    <Icon className={`h-4 w-4 ${active ? "text-gold" : ""}`} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t p-3 text-xs text-muted-foreground">
              <p className="truncate">{userEmail}</p>
              <div className="mt-0.5 flex items-center gap-1">
                <p className="min-w-0 flex-1 truncate">{household.name}</p>
                <Link
                  href="/settings"
                  aria-label="Settings"
                  title="Settings"
                  className={`rounded-md p-1 transition-colors hover:bg-accent hover:text-foreground ${
                    pathname === "/settings" || pathname.startsWith("/settings/")
                      ? "bg-accent text-gold"
                      : ""
                  }`}
                >
                  <Settings className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </aside>

          {/* Main column */}
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="sticky top-0 z-30">
              <header className="flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur lg:px-6">
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  aria-label="Toggle navigation"
                  aria-expanded={mobileOpen}
                  onClick={() => setMobileOpen((o) => !o)}
                >
                  {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
                <span className="font-serif text-lg font-semibold lg:hidden">Orbis</span>
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new Event(OPEN_COMMAND_EVENT))}
                  className="hidden items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:flex"
                >
                  <Search className="h-4 w-4" />
                  Search
                  <kbd className="ml-2 rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                    Ctrl K
                  </kbd>
                </button>
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new Event(OPEN_ASSISTANT_EVENT))}
                  className="hidden items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-sm transition-colors hover:bg-accent sm:flex"
                >
                  <Sparkles className="h-4 w-4 text-gold" />
                  Ask Orbis
                </button>
                <div className="ml-auto flex items-center gap-2">
                  <QuickAdd />
                  <ScopePicker />
                  <CurrencyToggle />
                  <ThemeToggle />
                  <Button variant="ghost" size="icon" onClick={onLogout} title="Log out">
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </header>

              {mobileOpen && (
                <nav className="grid max-h-[calc(100vh-3.5rem)] grid-cols-2 gap-1 overflow-y-auto border-b bg-card p-3 shadow-lg lg:hidden">
                  {nav.map((item) => {
                    const Icon = item.icon;
                    const active = item.cashflowView
                      ? pathname === "/cashflow" && (searchParams.get("view") ?? "income") === item.cashflowView
                      : pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex h-10 items-center gap-2 rounded-md px-3 text-sm ${
                          active
                            ? "bg-accent font-medium text-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              )}
            </div>

            <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
            <CommandPalette />
            <AssistantPanel />
          </div>
        </div>
      </CurrencyProvider>
    </ScopeProvider>
  );
}
