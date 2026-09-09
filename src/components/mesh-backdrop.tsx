"use client";

/** CSS mesh atmosphere — used when WebGPU is unavailable or reduced motion. */
export function MeshBackdrop({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 mesh-bg noise-overlay ${className ?? ""}`}
    />
  );
}
