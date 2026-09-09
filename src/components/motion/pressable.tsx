"use client";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/** Tactile press wrapper — sinks slightly on press. */
export function Pressable({
  children,
  className,
  asChild,
}: {
  children: React.ReactNode;
  className?: string;
  asChild?: boolean;
}) {
  const reduce = useReducedMotion();
  if (reduce || asChild) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      className={cn("inline-flex", className)}
      whileTap={{ scale: 0.97, y: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
    >
      {children}
    </motion.div>
  );
}
