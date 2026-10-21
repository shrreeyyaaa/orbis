import { useId } from "react";

/**
 * Orbis mark: a ring holding three rising bars and a warm "horizon" hill.
 * Colours follow the app theme (primary green + gold) so it works in light and dark.
 */
export function OrbisLogo({ className = "h-8 w-8" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="Orbis" fill="none">
      <defs>
        <clipPath id={`${id}-inner`}>
          <circle cx="24" cy="24" r="19.4" />
        </clipPath>
</defs>
      <circle cx="24" cy="24" r="21.2" stroke="hsl(var(--primary))" strokeWidth="2.2" />
      <g clipPath={`url(#${id}-inner)`}>
        <rect x="11.2" y="23" width="6.2" height="18" rx="1.7" fill="hsl(var(--primary))" />
        <rect x="20.9" y="17.5" width="6.2" height="22" rx="1.7" fill="hsl(var(--primary))" />
        <rect x="30.6" y="11" width="6.2" height="28" rx="1.7" fill="hsl(var(--primary))" />
        <circle cx="24" cy="43" r="15" fill="hsl(var(--gold))" />
      </g>
    </svg>
  );
}
