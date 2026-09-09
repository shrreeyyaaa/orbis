import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function ServiceUnavailablePage() {
  return (
    <main className="mesh-bg flex min-h-screen items-center justify-center px-5 py-16">
      <section className="elev w-full max-w-lg rounded-[1.75rem] border border-border bg-card p-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-600 dark:text-amber-300">
          <ShieldAlert className="h-5 w-5" aria-hidden />
        </span>
        <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">Protected by default</p>
        <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight">Orbis cannot verify your session.</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          The connected data service is temporarily unavailable. Your financial workspace has not been opened or replaced with sample data.
        </p>
        <Link href="/login" className="mt-6 inline-flex h-10 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          Try again
        </Link>
      </section>
    </main>
  );
}
