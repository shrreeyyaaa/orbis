"use client";
import { cloneElement, isValidElement, useId } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CURRENCIES } from "@/lib/currency";
import type { Owner } from "@/lib/types";

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  const fieldId = useId();
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const control = isValidElement(children)
    ? cloneElement(children as React.ReactElement<any>, {
        id: fieldId,
        ...(hintId ? { "aria-describedby": hintId } : {}),
      })
    : children;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={fieldId}>{label}</Label>
      {control}
      {hint && <p id={hintId} className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function MoneyInput({
  label,
  amount,
  currency,
  onAmount,
  onCurrency,
  hint,
}: {
  label: string;
  amount: string;
  currency: string;
  onAmount: (v: string) => void;
  onCurrency: (v: string) => void;
  hint?: string;
}) {
  const amountId = useId();
  const hintId = hint ? `${amountId}-hint` : undefined;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={amountId}>{label}</Label>
      <div className="flex gap-2">
        <Input
          id={amountId}
          aria-describedby={hintId}
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          onChange={(e) => onAmount(e.target.value)}
          className="flex-1"
        />
        <Select value={currency} onValueChange={onCurrency}>
          <SelectTrigger aria-label={`${label} currency`} className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {hint && <p id={hintId} className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function CurrencySelect({
  value,
  onChange,
  id,
  "aria-describedby": ariaDescribedBy,
}: {
  value: string;
  onChange: (v: string) => void;
  id?: string;
  "aria-describedby"?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} aria-describedby={ariaDescribedBy}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CURRENCIES.map((c) => (
          <SelectItem key={c.code} value={c.code}>
            {c.code} &middot; {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function OwnerSelect({
  owners,
  value,
  onChange,
  allowNone,
  id,
  "aria-describedby": ariaDescribedBy,
}: {
  owners: Owner[];
  value: string;
  onChange: (v: string) => void;
  allowNone?: boolean;
  id?: string;
  "aria-describedby"?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} aria-describedby={ariaDescribedBy}>
        <SelectValue placeholder="Select owner" />
      </SelectTrigger>
      <SelectContent>
        {allowNone && <SelectItem value="none">Whole family</SelectItem>}
        {owners.map((o) => (
          <SelectItem key={o.id} value={o.id}>
            {o.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function EnumSelect<T extends string>({
  value,
  onChange,
  options,
  placeholder,
  id,
  "aria-describedby": ariaDescribedBy,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Record<string, string>;
  placeholder?: string;
  id?: string;
  "aria-describedby"?: string;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as T)}>
      <SelectTrigger id={id} aria-describedby={ariaDescribedBy}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(options).map(([k, label]) => (
          <SelectItem key={k} value={k}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
