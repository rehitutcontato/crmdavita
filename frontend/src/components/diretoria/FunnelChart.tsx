"use client";

import React from "react";
import { Send, CheckCircle, Gift, ShieldAlert, ArrowRight } from "lucide-react";
import { type FunnelCounts } from "@/lib/api";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";

interface FunnelChartProps {
  funnel?: FunnelCounts | null;
}

export function FunnelChart({ funnel }: FunnelChartProps) {
  const disparadas = funnel?.disparadas ?? 0;
  const ativadas = funnel?.ativadas ?? 0;
  const resgatadas = funnel?.resgatadas ?? 0;

  // Conversion rates
  const taxaAtivacao = disparadas > 0 ? (ativadas / disparadas) * 100 : 0;
  const taxaResgate = ativadas > 0 ? (resgatadas / ativadas) * 100 : 0;
  const taxaGlobal = disparadas > 0 ? (resgatadas / disparadas) * 100 : 0;
  const breakagePct = ativadas > 0 ? ((ativadas - resgatadas) / ativadas) * 100 : 0;

  const maxVal = Math.max(disparadas, 1);

  return (
    <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5 shadow-lg space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <span>Funil de Conversão & Breakage de Ofertas</span>
          </h3>
          <p className="text-xs text-zinc-400">
            Jornada do cliente: do disparo inteligente ao resgate no caixa (PDV)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
            Conversão Global: {taxaGlobal.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Visual Funnel Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
        {/* Step 1: Disparadas */}
        <div className="rounded-xl bg-zinc-850 p-3.5 border border-zinc-750 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-cyan-400" />
              1. Disparadas
            </span>
            <span className="text-[11px] text-zinc-500 font-mono">100% base</span>
          </div>

          <div className="my-1">
            <AnimatedNumber
              value={disparadas}
              format="integer"
              className="text-2xl font-black text-zinc-100"
            />
          </div>

          <div className="w-full h-1.5 bg-zinc-700 rounded-full overflow-hidden mt-2">
            <div className="h-full bg-cyan-500 rounded-full w-full" />
          </div>

          <p className="text-[11px] text-zinc-500 mt-2">
            Ofertas enviadas via app & WhatsApp
          </p>
        </div>

        {/* Step 2: Ativadas */}
        <div className="rounded-xl bg-zinc-850 p-3.5 border border-emerald-500/30 flex flex-col justify-between relative overflow-hidden shadow-[0_0_15px_rgba(16,185,129,0.05)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              2. Ativadas (Opt-in)
            </span>
            <span className="text-[11px] font-semibold text-emerald-400">
              {taxaAtivacao.toFixed(1)}%
            </span>
          </div>

          <div className="my-1">
            <AnimatedNumber
              value={ativadas}
              format="integer"
              className="text-2xl font-black text-emerald-300"
            />
          </div>

          <div className="w-full h-1.5 bg-zinc-700 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (ativadas / maxVal) * 100)}%` }}
            />
          </div>

          <p className="text-[11px] text-emerald-500/80 mt-2">
            Cliente confirmou interesse no app
          </p>
        </div>

        {/* Step 3: Resgatadas */}
        <div className="rounded-xl bg-zinc-850 p-3.5 border border-zinc-750 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Gift className="w-3.5 h-3.5 text-violet-400" />
              3. Resgatadas (PDV)
            </span>
            <span className="text-[11px] font-semibold text-violet-400">
              {taxaResgate.toFixed(1)}% das ativadas
            </span>
          </div>

          <div className="my-1">
            <AnimatedNumber
              value={resgatadas}
              format="integer"
              className="text-2xl font-black text-violet-300"
            />
          </div>

          <div className="w-full h-1.5 bg-zinc-700 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-violet-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (resgatadas / maxVal) * 100)}%` }}
            />
          </div>

          <p className="text-[11px] text-zinc-400 mt-2">
            Passaram no caixa com desconto aplicado
          </p>
        </div>
      </div>

      {/* Breakage Thesis Banner */}
      <div className="rounded-xl bg-gradient-to-r from-amber-500/10 via-zinc-900 to-emerald-500/10 p-3 border border-amber-500/20 flex items-start gap-2.5 text-xs">
        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-zinc-300 leading-relaxed">
          <strong className="text-amber-300">Blindagem de Margem por Breakage ({breakagePct.toFixed(1)}%):</strong>{" "}
          Diferente da promoção em encarte físico (que dá desconto a todo mundo e canibaliza a margem), o CRM Preditivo exige o opt-in consciente do cliente. A indústria patrocinadora subsidia apenas as ofertas efetivamente resgatadas, gerando fluxo à loja sem queimar margem desnecessária.
        </div>
      </div>
    </div>
  );
}
