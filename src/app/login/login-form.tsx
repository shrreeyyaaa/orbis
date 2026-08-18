"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth-shell";
import { OAuthButtons } from "@/components/oauth-buttons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const [email, setEmail] = useState("demo@orbis.local");
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your wealth dashboard.">
      {/* Demo Credentials Box */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs space-y-1.5 mb-2">
        <div className="font-semibold text-primary flex items-center gap-1.5 text-sm">
          <span>✨</span> Demo Access Credentials
        </div>
        <div className="text-muted-foreground leading-relaxed">
          You can sign in using the demo account credentials below or any test email:
        </div>
        <div className="pt-1 font-mono text-[11px] space-y-1">
          <div><span className="text-muted-foreground">Email:</span> <strong className="text-foreground bg-background/80 px-1.5 py-0.5 rounded border border-border">demo@orbis.local</strong></div>
          <div><span className="text-muted-foreground">Password:</span> <strong className="text-foreground bg-background/80 px-1.5 py-0.5 rounded border border-border">demo123</strong></div>
        </div>
      </div>

      <OAuthButtons next={next} />

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in..." : "Sign in to Dashboard"}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Create one
        </Link>
      </p>
    </AuthShell>
  );
}
