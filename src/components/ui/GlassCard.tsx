"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Glass surface card. Optional hover lift (scale 1.015 + brighter border).
 */
export default function GlassCard({
  children,
  className = "",
  hover = false,
  onClick,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  as?: "div" | "button";
}) {
  const Comp = as === "button" ? motion.button : motion.div;
  return (
    <Comp
      onClick={onClick}
      whileHover={
        hover
          ? { scale: 1.015, borderColor: "rgba(255,255,255,0.12)" }
          : undefined
      }
      transition={{ duration: 0.2 }}
      className={`glass p-6 ${hover ? "cursor-pointer" : ""} ${className}`}
    >
      {children}
    </Comp>
  );
}
