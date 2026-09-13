import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "emerald" | "cyan" | "amber" | "rose" | "violet" | "zinc";
  size?: "sm" | "md";
  className?: string;
  dot?: boolean;
}

export function Badge({
  children,
  variant = "zinc",
  size = "md",
  className = "",
  dot = false,
}: BadgeProps) {
  const variantStyles = {
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    rose: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    violet: "bg-violet-500/10 text-violet-400 border-violet-500/30",
    zinc: "bg-zinc-800/60 text-zinc-300 border-zinc-700/50",
  };

  const dotColors = {
    emerald: "bg-emerald-400",
    cyan: "bg-cyan-400",
    amber: "bg-amber-400",
    rose: "bg-rose-400",
    violet: "bg-violet-400",
    zinc: "bg-zinc-400",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
}
