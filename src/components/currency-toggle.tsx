"use client";
import { useCurrency } from "@/components/currency-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CURRENCIES } from "@/lib/currency";
import { Coins } from "lucide-react";

export function CurrencyToggle({ className }: { className?: string }) {
  const { displayCurrency, setDisplayCurrency } = useCurrency();
  return (
    <Select value={displayCurrency} onValueChange={setDisplayCurrency}>
      <SelectTrigger className={`h-8 min-w-0 gap-1 px-2 ${className ?? "w-[100px]"}`} title="Display currency">
        <Coins className="h-3.5 w-3.5 shrink-0 opacity-60" />
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
  );
}
