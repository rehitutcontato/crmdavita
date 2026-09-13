"use client";

import React from "react";
import { DollarSign, Receipt, ShoppingBag, Percent } from "lucide-react";
import { type TradicionalMetrics } from "@/lib/api";
import { MetricCard } from "./MetricCard";

interface TraditionalBlockProps {
  metrics?: TradicionalMetrics | null;
}

export function TraditionalBlock({ metrics }: TraditionalBlockProps) {
  const faturamento = metrics?.faturamento_total_dia ?? 0;
  const cupons = metrics?.cupons_emitidos_dia ?? 0;
  const ticketMedio = metrics?.ticket_medio_geral ?? 0;
  const margem = metrics?.margem_operacional_pct ?? 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-zinc-200 tracking-wide uppercase flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            Bloco 1 — Visão Tradicional de Varejo
          </h2>
          <p className="text-xs text-zinc-500">
            Métricas padrão de BI do supermercado (faturamento, fluxo de cupons e margem líquida)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <MetricCard
          title="Faturamento Total Dia"
          value={faturamento}
          format="currency"
          icon={<DollarSign className="w-4 h-4" />}
          subtitle="Acumulado das 6 lojas hoje"
          highlightColor="cyan"
        />

        <MetricCard
          title="Cupons Emitidos Dia"
          value={cupons}
          format="integer"
          icon={<Receipt className="w-4 h-4" />}
          subtitle="Transações concluídas no PDV"
          highlightColor="cyan"
        />

        <MetricCard
          title="Ticket Médio Geral"
          value={ticketMedio}
          format="currency"
          icon={<ShoppingBag className="w-4 h-4" />}
          subtitle="Valor médio por cupom fiscal"
          highlightColor="cyan"
        />

        <MetricCard
          title="Margem Operacional Rede"
          value={margem}
          format="percent"
          icon={<Percent className="w-4 h-4" />}
          subtitle="Margem líquida após despesas operacionais"
          highlightColor="cyan"
        />
      </div>
    </div>
  );
}
