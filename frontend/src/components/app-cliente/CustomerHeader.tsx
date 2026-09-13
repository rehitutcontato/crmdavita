"use client";

import React from "react";
import { Sparkles, QrCode, Coins, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface CustomerHeaderProps {
  name: string;
  cpf: string;
}

export function CustomerHeader({
  name = "Mariana Oliveira Silva",
  cpf = "342.***.***-89",
}: CustomerHeaderProps) {
  return (
    <div className="p-4 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-900 border-b border-zinc-800/80">
      {/* Brand & QR Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center font-bold text-white text-sm shadow-md shadow-emerald-950/50">
            D
          </div>
          <div>
            <h1 className="text-xs font-bold tracking-wider text-emerald-400 uppercase">
              Clube Davita
            </h1>
            <p className="text-[10px] text-zinc-500">Supermercados</p>
          </div>
        </div>

        <button
          className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800/80 hover:bg-zinc-700/80 rounded-lg text-zinc-300 text-xs font-medium border border-zinc-700/60 transition"
          title="Meu QR Code Clube Davita"
        >
          <QrCode className="w-3.5 h-3.5 text-emerald-400" />
          <span>Meu CPF</span>
        </button>
      </div>

      {/* Customer Identification Card */}
      <div className="rounded-2xl bg-gradient-to-br from-zinc-800/90 via-zinc-850 to-zinc-900 p-3.5 border border-zinc-700/60 shadow-lg relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-sm font-semibold text-zinc-100">{name}</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xs text-zinc-400 font-mono tracking-wide">
              CPF: {cpf}
            </p>
          </div>

          <Badge variant="emerald" size="sm" dot>
            Cliente Black
          </Badge>
        </div>

        {/* Loyalty & Savings summary */}
        <div className="mt-3 pt-2.5 border-t border-zinc-750 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-zinc-300">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>
              <strong className="text-zinc-100 font-semibold">1.840</strong> pts
            </span>
          </div>

          <div className="flex items-center gap-1 text-emerald-400 text-[11px]">
            <Sparkles className="w-3 h-3" />
            <span>Economizou R$ 412 no ano</span>
          </div>
        </div>
      </div>
    </div>
  );
}
