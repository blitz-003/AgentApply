"use client";

import { motion, useInView } from "framer-motion";
import { useRef, type ReactNode } from "react";

type RevealVariant =
  | "fade"
  | "fade-up"
  | "slide-left"
  | "slide-right"
  | "zoom"
  | "blur";

interface RevealProps {
  children: ReactNode;
  className?: string;
  variant?: RevealVariant;
  delay?: number;
  duration?: number;
  once?: boolean;
}

const hiddenByVariant: Record<RevealVariant, { opacity: number; y?: number; x?: number; scale?: number; filter?: string }> = {
  fade: { opacity: 0 },
  "fade-up": { opacity: 0, y: 40 },
  "slide-left": { opacity: 0, x: -80 },
  "slide-right": { opacity: 0, x: 80 },
  zoom: { opacity: 0, scale: 0.92 },
  blur: { opacity: 0, y: 24, filter: "blur(8px)" },
};

const visibleByVariant: Record<RevealVariant, { opacity: number; y?: number; x?: number; scale?: number; filter?: string }> = {
  fade: { opacity: 1 },
  "fade-up": { opacity: 1, y: 0 },
  "slide-left": { opacity: 1, x: 0 },
  "slide-right": { opacity: 1, x: 0 },
  zoom: { opacity: 1, scale: 1 },
  blur: { opacity: 1, y: 0, filter: "blur(0px)" },
};

export function Reveal({
  children,
  className,
  variant = "fade-up",
  delay = 0,
  duration = 1.8,
  once = false,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, amount: 0.2 });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={hiddenByVariant[variant]}
      animate={inView ? visibleByVariant[variant] : hiddenByVariant[variant]}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}