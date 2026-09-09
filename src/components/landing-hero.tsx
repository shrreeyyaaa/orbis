"use client";
import dynamic from "next/dynamic";

const FlyingMoneyCanvas = dynamic(
  () => import("@/components/vgpu-orb-canvas").then((m) => m.FlyingMoneyCanvas),
  { ssr: false, loading: () => null },
);

export function LandingHero() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(90% 70% at 50% 100%, hsl(158 40% 18% / 0.35), transparent 55%), radial-gradient(60% 50% at 80% 10%, hsl(210 50% 30% / 0.2), transparent 50%), #070b14",
        }}
      />
      <FlyingMoneyCanvas className="absolute inset-0" />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 80% at 30% 55%, transparent 10%, #070b14 88%)",
        }}
      />
    </div>
  );
}
