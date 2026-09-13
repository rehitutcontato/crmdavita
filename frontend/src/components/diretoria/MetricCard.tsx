"use client";

import React from "react";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";

interface MetricCardProps {
  title: string;
  value: number;
  format?: "currency" | "integer" | "percent" | "decimal";
  icon: React.ReactNode;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  highlightColor?: "emerald" | "cyan" | "amber" | "violet";
}

export function MetricCard({
  title,
  value,
  format = "decimal",
  icon,
  subtitle,
  trend,
  highlightColor = "cyan",
}: MetricCardProps) {
  const colorMap = {
    emerald: "from-emerald-500/10 via-zinc-900 to-zinc-900 border-emerald-500/20 text-emerald-400",
    cyan: "from-cyan-500/10 via-zinc-900 to-zinc-900 border-cyan-500/20 text-cyan-400",
    amber: "from-amber-500/10 via-zinc-900 to-zinc-900 border-amber-500/20 text-amber-400",
    violet: "from-violet-500/10 via-zinc-900 to-zinc-900 border-violet-500/20 text-violet-400",
  };

  const iconBgMap = {
    emerald: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    cyan: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    amber: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    violet: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  };

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 bg-gradient-to-br border ${colorMap[highlightColor]} shadow-md transition-all hover:border-zinc-700/80`}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
          {title}
        </span>
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center border ${iconBgMap[highlightColor]}`}
        >
          {icon}
        </div>
      </div>

      <div className="flex items-baseline gap-2 mb-1">
        <AnimatedNumber
          value={value}
          format={format}
          className="text-2xl sm:text-3xl font-extrabold text-zinc-50 tracking-tight"
        />
        {trend && (
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              trend.isPositive !== false
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>

      {subtitle && <p className="text-xs text-zinc-400 mt-1">{subtitle}</p>}
    </div>
  );
}
