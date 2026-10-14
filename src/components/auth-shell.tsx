"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { LineChart } from "lucide-react";
import { useTheme } from "next-themes";
import { ThemeToggle } from "@/components/theme-toggle";
import { Reveal } from "@/components/motion/reveal";

const FlyingMoneyCanvas = dynamic(
  () => import("@/components/vgpu-orb-canvas").then((m) => m.FlyingMoneyCanvas),
  { ssr: false, loading: () => null },
);

/**
 * Centered auth card over flying-money field.
 * Brand is small; the form is the composition.
 */
export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const { resolvedTheme } = useTheme();

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Keep the ambient field in the same theme as the form. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(90% 70% at 50% 100%, hsl(var(--primary) / 0.12), transparent 55%), radial-gradient(60% 50% at 80% 10%, hsl(var(--muted-foreground) / 0.06), transparent 50%)",
        }}
      />
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <FlyingMoneyCanvas
          className="absolute inset-0"
          appearance={resolvedTheme === "light" ? "light" : "dark"}
        />
      </div>
      {/* vignette so form stays readable */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-25 dark:opacity-100"
        style={{
          background:
            "radial-gradient(ellipse 55% 70% at 50% 50%, transparent 20%, hsl(var(--background)) 92%)",
        }}
      />

      <div className="absolute right-4 top-4 z-30">
        <ThemeToggle />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 pb-10 pt-20">
        <Reveal className="w-full max-w-[420px]">
          <Link href="/" className="mb-8 flex items-center justify-center gap-2">
            <LineChart className="h-5 w-5 text-primary" />
            <span className="font-serif text-xl font-semibold tracking-tight">Orbis</span>
          </Link>

          <div className="rounded-2xl border border-border bg-card/95 p-5 text-card-foreground shadow-[0_24px_80px_-32px_hsl(var(--foreground)/0.18)] backdrop-blur-md dark:shadow-[0_40px_100px_-40px_rgba(0,0,0,0.9)] sm:p-8">
            <h1 className="text-center font-serif text-[1.75rem] font-semibold tracking-tight sm:text-3xl">
              {title}
            </h1>
            <p className="mt-1.5 text-center text-sm text-muted-foreground">{subtitle}</p>
            <div className="mt-7 space-y-5 [&_input]:bg-muted/40 [&_input]:text-foreground">
              {children}
            </div>
          </div>

          <p className="mt-6 text-center text-[11px] tracking-wide text-muted-foreground">
            Money in motion
          </p>
        </Reveal>
      </div>
    </div>
  );
}
