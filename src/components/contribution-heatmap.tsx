"use client";
import { useMemo } from "react";

/** GitHub-style contribution heatmap for activity days (YYYY-MM-DD). */
export function ContributionHeatmap({ activeDays }: { activeDays: string[] }) {
  const set = useMemo(() => new Set(activeDays), [activeDays]);
  const cells = useMemo(() => {
    const out: { key: string; level: number }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 83; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      out.push({ key, level: set.has(key) ? 3 : 0 });
    }
    return out;
  }, [set]);

  return (
    <div className="flex flex-wrap gap-1">
      {cells.map((c) => (
        <div
          key={c.key}
          title={c.key}
          className={`h-2.5 w-2.5 rounded-sm ${
            c.level > 0 ? "bg-orbit" : "bg-muted"
          }`}
        />
      ))}
    </div>
  );
}
