"use client";
import { useEffect, useRef, useState } from "react";

type Bill = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  w: number;
  h: number;
  kind: "bill" | "coin" | "glyph";
  glyph: string;
  hue: number;
  alpha: number;
  depth: number;
};

const GLYPHS = ["$", "€", "£", "¥", "₹", "₩", "₿"];

function makeMoney(w: number, h: number): Bill[] {
  const out: Bill[] = [];
  for (let i = 0; i < 28; i++) {
    const kindRoll = Math.random();
    const kind: Bill["kind"] = kindRoll < 0.45 ? "bill" : kindRoll < 0.75 ? "coin" : "glyph";
    out.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.55,
      vy: -0.35 - Math.random() * 1.1,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.04,
      w: kind === "bill" ? 54 + Math.random() * 36 : kind === "coin" ? 18 + Math.random() * 14 : 28,
      h: kind === "bill" ? 28 + Math.random() * 16 : 0,
      kind,
      glyph: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
      hue: kind === "bill" ? 145 + Math.random() * 25 : kind === "coin" ? 42 + Math.random() * 18 : 174,
      alpha: 0.35 + Math.random() * 0.45,
      depth: 0.5 + Math.random() * 0.5,
    });
  }
  return out;
}

/** Soft flying currency — bills, coins, glyphs drifting upward. */
export function FlyingMoneyCanvas({
  className,
  appearance = "dark",
}: {
  className?: string;
  appearance?: "light" | "dark";
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState(false);
  const pointer = useRef({ x: 0.5, y: 0.5 });
  const appearanceRef = useRef(appearance);

  // Recolor the existing particles without restarting their motion on theme changes.
  useEffect(() => {
    appearanceRef.current = appearance;
  }, [appearance]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let cancelled = false;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    setActive(true);

    let money: Bill[] = [];
    let w = 0;
    let h = 0;

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      pointer.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      };
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let raf = 0;
    const draw = () => {
      if (cancelled) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;
      if (cw && ch && (canvas.width !== Math.floor(cw * dpr) || canvas.height !== Math.floor(ch * dpr))) {
        canvas.width = Math.floor(cw * dpr);
        canvas.height = Math.floor(ch * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        w = cw;
        h = ch;
        money = makeMoney(w, h);
      }

      ctx.clearRect(0, 0, w, h);
      const isLight = appearanceRef.current === "light";

      // atmospheric wash
      const g = ctx.createRadialGradient(
        w * (0.35 + pointer.current.x * 0.25),
        h * (0.55 + pointer.current.y * 0.15),
        40,
        w * 0.5,
        h * 0.5,
        Math.max(w, h) * 0.75,
      );
      g.addColorStop(0, isLight ? "hsla(158, 45%, 48%, 0.045)" : "hsla(158, 45%, 28%, 0.22)");
      g.addColorStop(0.45, isLight ? "hsla(210, 40%, 48%, 0.025)" : "hsla(210, 40%, 18%, 0.12)");
      g.addColorStop(1, "hsla(222, 48%, 6%, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      const windX = (pointer.current.x - 0.5) * 1.4;

      for (const m of money) {
        m.x += m.vx * m.depth + windX * 0.35 * m.depth;
        m.y += m.vy * m.depth;
        m.rot += m.vr;

        if (m.y < -80) {
          m.y = h + 40;
          m.x = Math.random() * w;
        }
        if (m.x < -80) m.x = w + 40;
        if (m.x > w + 80) m.x = -40;

        ctx.save();
        ctx.translate(m.x, m.y);
        ctx.rotate(m.rot);
        ctx.globalAlpha = isLight ? 0.5 + m.alpha * m.depth * 0.4 : m.alpha * m.depth;

        if (m.kind === "bill") {
          const rw = m.w;
          const rh = m.h;
          // bill body
          ctx.fillStyle = isLight
            ? `hsla(${m.hue}, 38%, 67%, 0.95)`
            : `hsla(${m.hue}, 42%, 38%, 0.95)`;
          ctx.strokeStyle = isLight
            ? `hsl(${m.hue}, 52%, 30%)`
            : `hsla(${m.hue}, 50%, 55%, 0.9)`;
          ctx.lineWidth = isLight ? 1.5 : 1.2;
          roundRect(ctx, -rw / 2, -rh / 2, rw, rh, 4);
          ctx.fill();
          ctx.stroke();
          // center oval
          ctx.beginPath();
          ctx.ellipse(0, 0, rw * 0.18, rh * 0.28, 0, 0, Math.PI * 2);
          ctx.strokeStyle = isLight
            ? `hsla(${m.hue}, 55%, 26%, 0.9)`
            : `hsla(${m.hue}, 55%, 70%, 0.7)`;
          ctx.stroke();
          // corner marks
          ctx.fillStyle = isLight
            ? `hsl(${m.hue}, 60%, 22%)`
            : `hsla(${m.hue}, 60%, 78%, 0.85)`;
          ctx.font = `bold ${Math.max(10, rw * 0.22)}px ui-monospace, monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(m.glyph, -rw * 0.32, -rh * 0.05);
          ctx.fillText(m.glyph, rw * 0.32, rh * 0.05);
        } else if (m.kind === "coin") {
          const r = m.w / 2;
          const hue = isLight ? 36 + (m.hue - 42) * 0.4 : m.hue;
          const cg = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 1, 0, 0, r);
          cg.addColorStop(0, `hsl(${hue}, 70%, ${isLight ? 68 : 72}%)`);
          cg.addColorStop(1, `hsl(${hue}, ${isLight ? 68 : 55}%, 38%)`);
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fillStyle = cg;
          ctx.fill();
          ctx.strokeStyle = isLight
            ? `hsl(${hue}, 68%, 30%)`
            : `hsla(${hue}, 60%, 80%, 0.7)`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.fillStyle = `hsla(${hue}, 30%, 18%, 0.85)`;
          ctx.font = `bold ${Math.max(9, r * 0.9)}px ui-monospace, monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(m.glyph, 0, 1);
        } else {
          ctx.fillStyle = isLight
            ? `hsla(${m.hue}, 60%, 28%, 0.9)`
            : `hsla(${m.hue}, 65%, 62%, 0.9)`;
          ctx.font = `600 ${m.w}px "Fraunces", Georgia, serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.shadowColor = `hsla(${m.hue}, 70%, 50%, 0.45)`;
          ctx.shadowBlur = isLight ? 0 : 12;
          ctx.fillText(m.glyph, 0, 0);
          ctx.shadowBlur = 0;
        }

        ctx.restore();
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: "100%", height: "100%", opacity: active ? 1 : 0, transition: "opacity 0.5s ease" }}
      aria-hidden
    />
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** @deprecated Use FlyingMoneyCanvas — kept as alias for existing imports. */
export function VgpuOrbCanvas(props: { className?: string }) {
  return <FlyingMoneyCanvas {...props} />;
}
