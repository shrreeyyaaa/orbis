"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useScope } from "@/components/scope-context";
import { useNewParam } from "@/lib/use-new-param";
import { toast } from "@/components/ui/use-toast";
import { useCurrency } from "@/components/currency-context";
import { PageHeader, EmptyState } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Field, MoneyInput, OwnerSelect, EnumSelect } from "@/components/form-fields";
import { ProgressRing } from "@/components/motion/progress-ring";
import { GOAL_TYPE_LABELS } from "@/lib/labels";
import { toMinor, fromMinor } from "@/lib/currency";
import { toBase } from "@/lib/fx";
import { monthlyAllocationMinor } from "@/lib/goal-funding";
import type {
  Goal,
  GoalIncomeAllocation,
  GoalType,
  IncomeSource,
  Owner,
} from "@/lib/types";
import { Target, Plus, Pencil, Trash2 } from "lucide-react";

export function GoalsView({
  householdId,
  owners,
  goals,
  incomeSources,
  allocations,
}: {
  householdId: string;
  owners: Owner[];
  goals: Goal[];
  incomeSources: IncomeSource[];
  allocations: GoalIncomeAllocation[];
}) {
  const router = useRouter();
  const { includesOwner } = useScope();
  const { show, reportingCurrency, rates } = useCurrency();
  const ownerName = useMemo(() => new Map(owners.map((o) => [o.id, o.name])), [owners]);
  const incomeById = useMemo(() => new Map(incomeSources.map((s) => [s.id, s])), [incomeSources]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [fundsGoal, setFundsGoal] = useState<Goal | null>(null);
  useNewParam(() => {
    setEditing(null);
    setOpen(true);
  });

  const visible = goals.filter((g) => g.owner_id == null || includesOwner(g.owner_id));

  function monthsUntil(date: string | null): number | null {
    if (!date) return null;
    const diff = (new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30.4);
    return Math.max(0, Math.round(diff));
  }

  function goalAllocations(goalId: string) {
    return allocations.filter((a) => a.goal_id === goalId && a.is_active);
  }

  function monthlyAllocatedReporting(goalId: string) {
    return goalAllocations(goalId).reduce((sum, a) => {
      const src = incomeById.get(a.income_source_id);
      if (!src) return sum;
      const m = monthlyAllocationMinor(a, src);
      return sum + toBase(m, src.currency, reportingCurrency, rates);
    }, 0);
  }

  return (
    <div>
      <PageHeader
        title="Goals"
        description="Education funds, emergency reserves, retirement — funded by planned income allocations."
        action={
          <Button onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="h-4 w-4" /> Add goal
          </Button>
        }
      />

      {visible.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals yet"
          description="Set targets like a kids' 529 education fund, a 6-month emergency fund, or a retirement number, and track progress."
          action={
            <Button onClick={() => { setEditing(null); setOpen(true); }}>
              <Plus className="h-4 w-4" /> Add your first goal
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visible.map((g) => {
            const saved = toBase(g.manual_saved_minor, g.currency, reportingCurrency, rates);
            const target = toBase(g.target_minor, g.currency, reportingCurrency, rates);
            const pct = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;
            const remaining = Math.max(0, target - saved);
            const months = monthsUntil(g.target_date);
            const monthlyNeeded = months && months > 0 ? Math.round(remaining / months) : null;
            const monthlyPlan = monthlyAllocatedReporting(g.id);
            const fundedBy = goalAllocations(g.id)
              .map((a) => incomeById.get(a.income_source_id)?.name)
              .filter(Boolean) as string[];
            return (
              <Card key={g.id} className="card-hover overflow-hidden">
                <div className="orbit-rule h-0.5" />
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <ProgressRing value={pct} size={64} stroke={5} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{g.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {GOAL_TYPE_LABELS[g.type]}
                            {g.owner_id ? ` · ${ownerName.get(g.owner_id)}` : " · Whole family"}
                            {g.target_date ? ` · by ${g.target_date}` : ""}
                          </p>
                        </div>
                        <Badge variant={pct >= 100 ? "success" : "secondary"}>{pct}%</Badge>
                      </div>
                      <div className="mt-2 flex justify-between text-sm font-mono tabular-nums">
                        <span>{show(saved)}</span>
                        <span className="text-muted-foreground">{show(target)}</span>
                      </div>
                      {fundedBy.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {fundedBy.map((n) => (
                            <Badge key={n} variant="outline" className="text-[10px]">
                              {n}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {monthlyNeeded != null && pct < 100 && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Need {show(monthlyNeeded)}/mo
                          {monthlyPlan > 0 ? ` · plan covers ${show(Math.round(monthlyPlan))}/mo` : ""}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-end gap-1">
                    <Button variant="outline" size="sm" onClick={() => setFundsGoal(g)}>
                      <Plus className="h-3.5 w-3.5" />
                      Add funds
                    </Button>
                    <Button aria-label={`Edit ${g.name}`} title={`Edit ${g.name}`} variant="ghost" size="icon" onClick={() => { setEditing(g); setOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      aria-label={`Delete ${g.name}`}
                      title={`Delete ${g.name}`}
                      variant="ghost"
                      size="icon"
                      onClick={async () => {
                        if (!confirm(`Delete ${g.name}?`)) return;
                        await createClient().from("goals").delete().eq("id", g.id);
                        toast({ title: "Goal deleted" });
                        router.refresh();
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <GoalDialog
        key={editing?.id ?? "new"}
        open={open}
        onOpenChange={setOpen}
        householdId={householdId}
        owners={owners}
        goal={editing}
        incomeSources={incomeSources}
        allocations={allocations}
        onSaved={() => {
          setOpen(false);
          toast({ title: editing ? "Goal updated" : "Goal added", variant: "success" });
          router.refresh();
        }}
      />

      <AddFundsDialog
        key={fundsGoal?.id ?? "funds"}
        open={!!fundsGoal}
        onOpenChange={(o) => !o && setFundsGoal(null)}
        householdId={householdId}
        goal={fundsGoal}
        onSaved={(added) => {
          const g = fundsGoal;
          setFundsGoal(null);
          toast({
            title: "Funds added",
            description: g ? `Added ${show(toBase(added, g.currency, reportingCurrency, rates))} to ${g.name}` : undefined,
            variant: "success",
          });
          router.refresh();
        }}
      />
    </div>
  );
}

function AddFundsDialog({
  open,
  onOpenChange,
  householdId,
  goal,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  householdId: string;
  goal: Goal | null;
  onSaved: (addedMinor: number) => void;
}) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  if (!goal) return null;
  const g = goal;
  const amountMinor = Number(toMinor(amount || "0", g.currency));
  const valid = Number.isFinite(amountMinor) && amountMinor > 0;

  async function save() {
    if (!valid) return;
    setSaving(true);
    const supabase = createClient();
    const today = new Date().toISOString().slice(0, 10);
    const newSaved = g.manual_saved_minor + amountMinor;
    await supabase.from("goal_contributions").insert({
      household_id: householdId,
      goal_id: g.id,
      income_source_id: null,
      amount_minor: amountMinor,
      currency: g.currency,
      applied_on: today,
      note: note || "Funds added",
    });
    await supabase.from("goals").update({ manual_saved_minor: newSaved }).eq("id", g.id);
    await supabase.from("financial_events").insert({
      household_id: householdId,
      kind: "contribution",
      title: `Added funds to ${g.name}`,
      occurred_on: today,
      goal_id: g.id,
      meta: { amount_minor: amountMinor },
    });
    if (g.target_minor > 0 && newSaved >= g.target_minor && g.manual_saved_minor < g.target_minor) {
      await supabase.from("financial_events").insert({
        household_id: householdId,
        kind: "goal_completed",
        title: `${g.name} fully funded`,
        occurred_on: today,
        goal_id: g.id,
      });
    }
    setSaving(false);
    onSaved(amountMinor);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add funds → {g.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Field label={`Amount (${g.currency})`}>
            <Input
              inputMode="decimal"
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 5000"
            />
          </Field>
          <Field label="Note (optional)">
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Bonus, monthly top-up" />
          </Field>
          <p className="text-xs text-muted-foreground">
            Saved so far {fromMinor(g.manual_saved_minor, g.currency)} of {fromMinor(g.target_minor, g.currency)} {g.currency}
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving || !valid}>
            <Plus className="h-4 w-4" /> {saving ? "Adding…" : "Add funds"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GoalDialog({
  open,
  onOpenChange,
  householdId,
  owners,
  goal,
  incomeSources,
  allocations,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  householdId: string;
  owners: Owner[];
  goal: Goal | null;
  incomeSources: IncomeSource[];
  allocations: GoalIncomeAllocation[];
  onSaved: () => void;
}) {
  const [name, setName] = useState(goal?.name ?? "");
  const [type, setType] = useState<GoalType>(goal?.type ?? "education");
  const [ownerId, setOwnerId] = useState(goal?.owner_id ?? "none");
  const [currency, setCurrency] = useState(goal?.currency ?? "USD");
  const [target, setTarget] = useState(goal ? fromMinor(goal.target_minor, goal.currency) : "");
  const [saved, setSaved] = useState(goal ? fromMinor(goal.manual_saved_minor, goal.currency) : "");
  const [targetDate, setTargetDate] = useState(goal?.target_date ?? "");
  const existingAlloc = goal
    ? allocations.find((a) => a.goal_id === goal.id && a.is_active)
    : undefined;
  const [incomeId, setIncomeId] = useState(existingAlloc?.income_source_id ?? "");
  const [allocMode, setAllocMode] = useState<"pct" | "fixed">(existingAlloc?.mode ?? "pct");
  const [pct, setPct] = useState(existingAlloc ? String(existingAlloc.value_bps / 100) : "10");
  const [fixed, setFixed] = useState(existingAlloc ? fromMinor(existingAlloc.value_minor, "USD") : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    const goalId = goal?.id ?? crypto.randomUUID();
    const payload = {
      household_id: householdId,
      owner_id: ownerId === "none" ? null : ownerId,
      name,
      type,
      currency,
      target_minor: Number(toMinor(target || "0", currency)),
      manual_saved_minor: Number(toMinor(saved || "0", currency)),
      target_date: targetDate || null,
    };
    const supabase = createClient();
    const { error } = goal
      ? await supabase.from("goals").update(payload).eq("id", goal.id)
      : await supabase.from("goals").insert({ id: goalId, ...payload });
    if (error) { setSaving(false); setError(error.message); return; }

    if (incomeId) {
      const allocPayload = {
        household_id: householdId,
        goal_id: goalId,
        income_source_id: incomeId,
        mode: allocMode,
        value_bps: allocMode === "pct" ? Math.round(Number(pct || "0") * 100) : 0,
        value_minor: allocMode === "fixed" ? Number(toMinor(fixed || "0", "USD")) : 0,
        is_active: true,
      };
      if (existingAlloc) {
        await supabase.from("goal_income_allocations").update(allocPayload).eq("id", existingAlloc.id);
      } else {
        await supabase.from("goal_income_allocations").insert(allocPayload);
      }
    } else if (existingAlloc) {
      await supabase.from("goal_income_allocations").update({ is_active: false }).eq("id", existingAlloc.id);
    }
    setSaving(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{goal ? "Edit goal" : "Add goal"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Goal name">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Emma's college fund" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <EnumSelect value={type} onChange={setType} options={GOAL_TYPE_LABELS} />
            </Field>
            <Field label="For">
              <OwnerSelect owners={owners} value={ownerId} onChange={setOwnerId} allowNone />
            </Field>
          </div>
          <MoneyInput label="Target amount" amount={target} currency={currency} onAmount={setTarget} onCurrency={setCurrency} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Saved so far">
              <Input inputMode="decimal" value={saved} onChange={(e) => setSaved(e.target.value)} />
            </Field>
            <Field label="Target date">
              <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
            </Field>
          </div>

          <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
            <p className="text-sm font-medium">Income allocation</p>
            <Field label="Fund from income source">
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                value={incomeId}
                onChange={(e) => setIncomeId(e.target.value)}
              >
                <option value="">No allocation</option>
                {incomeSources.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </Field>
            {incomeId && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Mode">
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                    value={allocMode}
                    onChange={(e) => setAllocMode(e.target.value as "pct" | "fixed")}
                  >
                    <option value="pct">Percent of income</option>
                    <option value="fixed">Fixed monthly amount</option>
                  </select>
                </Field>
                {allocMode === "pct" ? (
                  <Field label="Percent">
                    <Input inputMode="decimal" value={pct} onChange={(e) => setPct(e.target.value)} />
                  </Field>
                ) : (
                  <Field label="Monthly amount">
                    <Input inputMode="decimal" value={fixed} onChange={(e) => setFixed(e.target.value)} />
                  </Field>
                )}
              </div>
            )}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving || !name}>{saving ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
