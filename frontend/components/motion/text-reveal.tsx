"use client";

import { motion, type Variants } from "framer-motion";

const motionTags = {
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  p: motion.p,
  span: motion.span,
  div: motion.div,
} as const;

interface TextRevealProps {
  text: string;
  className?: string;
  as?: keyof typeof motionTags;
  delay?: number;
  stagger?: number;
}

export function TextReveal({
  text,
  className,
  as = "span",
  delay = 0,
  stagger = 0.09,
}: TextRevealProps) {
  const MotionTag = motionTags[as];
  const words = text.split(" ");

  const container: Variants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: stagger, delayChildren: delay },
    },
  };

  const word: Variants = {
    hidden: { y: "-120%", opacity: 0, filter: "blur(12px)" },
    visible: {
      y: "0%",
      opacity: 1,
      filter: "blur(0px)",
      transition: { duration: 1.6, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.6 }}
      variants={container}
    >
      {words.map((wordText, i) => (
        <span
          key={i}
          className="inline-block overflow-hidden align-bottom"
        >
          <motion.span className="inline-block will-change-transform" variants={word}>
            {wordText}
            {i < words.length - 1 ? "\u00A0" : ""}
          </motion.span>
        </span>
      ))}
    </MotionTag>
  );
}