"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field } from "@/components/form-fields";
import { toast } from "@/components/ui/use-toast";
import type { FinancialEvent, Goal } from "@/lib/types";
import { CalendarDays, Plus, Trophy, Target, CircleDollarSign, Flag } from "lucide-react";

const KIND_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  achievement: Trophy,
  goal_completed: Target,
  contribution: CircleDollarSign,
  milestone: Flag,
  manual: CalendarDays,
};

function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = x.getDay();
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function EventsView({
  householdId,
  events,
  goals,
}: {
  householdId: string;
  events: FinancialEvent[];
  goals: Goal[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const week = useMemo(() => {
    const start = startOfWeek(new Date());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      return {
        key,
        label: d.toLocaleDateString(undefined, { weekday: "short" }),
        day: d.getDate(),
        count: events.filter((e) => e.occurred_on.slice(0, 10) === key).length,
        isToday: key === new Date().toISOString().slice(0, 10),
      };
    });
  }, [events]);

  const countdown = useMemo(() => {
    const upcoming = goals
      .filter((g) => g.target_date && g.manual_saved_minor < g.target_minor)
      .map((g) => {
        const days = Math.ceil(
          (new Date(g.target_date!).getTime() - Date.now()) / 86400000,
        );
        return { goal: g, days };
      })
      .filter((x) => x.days >= 0)
      .sort((a, b) => a.days - b.days);
    return upcoming[0] ?? null;
  }, [goals]);

  async function addManual() {
    if (!title.trim()) return;
    await createClient().from("financial_events").insert({
      household_id: householdId,
      kind: "manual",
      title: title.trim(),
      occurred_on: date,
      goal_id: null,
      meta: null,
    });
    toast({ title: "Event logged", variant: "success" });
    setOpen(false);
    setTitle("");
    router.refresh();
  }

  return (
    <div>
      <PageHeader
        title="Events"
        description="Financial timeline — contributions, milestones, achievements, and notes you log."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Log event
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 overflow-hidden">
          <div className="orbit-rule h-0.5" />
          <CardContent className="p-4">
            <p className="mb-3 text-sm font-medium">This week</p>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(4.75rem,1fr))] gap-2">
              {week.map((d) => (
                <div
                  key={d.key}
                  className={`min-w-0 rounded-lg border p-2 text-center ${
                    d.isToday ? "border-orbit bg-accent" : "border-border"
                  }`}
                >
                  <p className="text-[10px] uppercase text-muted-foreground">{d.label}</p>
                  <p className="font-mono text-lg font-semibold tabular-nums">{d.day}</p>
                  <p className={`mt-0.5 whitespace-nowrap text-[10px] font-medium ${d.count ? "text-orbit" : "text-muted-foreground"}`}>
                    {d.count ? `${d.count} ${d.count === 1 ? "event" : "events"}` : "No events"}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <div className="orbit-rule h-0.5" />
          <CardContent className="flex h-full flex-col justify-center p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Next goal deadline</p>
            {countdown ? (
              <>
                <p className="mt-2 font-serif text-2xl font-semibold">{countdown.goal.name}</p>
                <p className="mt-1 font-mono text-3xl font-semibold text-orbit tabular-nums">
                  {countdown.days}
                  <span className="ml-1 text-sm font-sans text-muted-foreground">days</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">by {countdown.goal.target_date}</p>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">No upcoming goal dates.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        {events.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No events yet. Apply goal contributions or log a note to start your streak.
            </CardContent>
          </Card>
        ) : (
          events.map((e) => {
            const Icon = KIND_ICON[e.kind] ?? CalendarDays;
            return (
              <Card key={e.id} className="card-hover">
                <CardContent className="flex items-start gap-3 p-4">
                  <div className="rounded-lg bg-accent p-2 text-orbit">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{e.title}</p>
                      <Badge variant="secondary" className="text-[10px] capitalize">
                        {e.kind.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{e.occurred_on}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log financial event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Field label="Title">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Bonus received" />
            </Field>
            <Field label="Date">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={addManual} disabled={!title.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
