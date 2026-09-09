"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const CORNER_RADIUS = 7;
const DASHED_RAIL =
  "repeating-linear-gradient(to bottom, currentColor 0 2px, transparent 2px 5px)";

export type HookSidebarItem = {
  href: string;
  label: string;
};

function HookRail({
  y,
  visible,
}: {
  y: number | null;
  visible: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const travel = reduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 420, damping: 34, mass: 0.7 };

  return (
    <motion.span
      aria-hidden
      initial={false}
      animate={{ opacity: visible && y !== null ? 1 : 0 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.16 }}
      className="pointer-events-none absolute inset-0 text-primary"
    >
      <motion.span
        initial={false}
        animate={{ height: Math.max(0, (y ?? 0) - CORNER_RADIUS) }}
        transition={travel}
        style={{ backgroundImage: DASHED_RAIL }}
        className="absolute left-0 top-0 w-px"
      />
      <motion.svg
        initial={false}
        animate={{ top: (y ?? 0) - CORNER_RADIUS }}
        transition={travel}
        width="16"
        height="8"
        viewBox="0 0 16 8"
        fill="none"
        className="absolute left-0"
      >
        <path
          d="M0.5 0.5a7 7 0 0 0 7 7H16"
          stroke="currentColor"
          strokeDasharray="2 3"
          strokeLinecap="round"
        />
      </motion.svg>
    </motion.span>
  );
}

export function HookSidebar({
  items,
  activeIndex,
  onNavigate,
}: {
  items: HookSidebarItem[];
  activeIndex: number;
  onNavigate?: () => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [centers, setCenters] = useState<number[]>([]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const measure = () => {
      setCenters(
        itemRefs.current.map((item) =>
          item ? item.offsetTop + item.offsetHeight / 2 : 0,
        ),
      );
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [items.length]);

  const activeY = activeIndex < 0 ? null : (centers[activeIndex] ?? null);

  return (
    <div
      ref={listRef}
      className="relative ml-5 mt-1.5 flex flex-col gap-0.5 pb-1 pl-5"
    >
      <HookRail y={activeY} visible={activeY !== null} />

      {items.map((item, index) => {
        const active = index === activeIndex;
        return (
          <Link
            key={item.href}
            ref={(element) => {
              itemRefs.current[index] = element;
            }}
            href={item.href}
            aria-current={active ? "page" : undefined}
            onClick={onNavigate}
            className={cn(
              "rounded-md px-2 py-2 text-[13px] leading-5 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
              active
                ? "font-semibold text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
