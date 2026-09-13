"use client";

import React from "react";
import {
  TrendingUp,
  Sparkles,
  Building2,
  Users,
  CheckCircle2,
  Trophy,
  Store,
  ArrowUpRight,
} from "lucide-react";
import { type CRMRetailMediaMetrics } from "@/lib/api";
import { MetricCard } from "./MetricCard";
import { FunnelChart } from "./FunnelChart";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";

interface CRMRetailMediaBlockProps {
  metrics?: CRMRetailMediaMetrics | null;
}

export function CRMRetailMediaBlock({ metrics }: CRMRetailMediaBlockProps) {
  const receitaIncremental = metrics?.receita_incremental_ofertas ?? 0;
  const ticketSemOferta = metrics?.ticket_medio_sem_oferta ?? 0;
  const ticketComOferta = metrics?.ticket_medio_com_oferta ?? 0;
  const aumentoCesta = metrics?.aumento_cesta_pct ?? 0;
  const volumeIndustria = metrics?.volume_financiado_industria ?? 0;
  const pessoasCompraramMais = metrics?.pessoas_compraram_a_mais_hoje ?? 0;
  const ofertasAtivadas = metrics?.ofertas_ativadas_hoje ?? 0;
  const produtoTop = metrics?.produto_mais_vendido ?? { nome: "—", unidades: 0 };
  const lojaTop = metrics?.loja_com_mais_promocoes ?? { nome: "—", total_promocoes: 0 };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-sm font-bold text-zinc-200 tracking-wide uppercase flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          Bloco 2 — O Poder do CRM Preditivo & Retail Media
        </h2>
        <p className="text-xs text-zinc-500">
          Geração de valor incremental: aumento do ticket médio, blindagem de margem e monetização com a indústria
        </p>
      </div>

      {/* Main KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <MetricCard
          title="Receita Incremental Ofertas"
          value={receitaIncremental}
          format="currency"
          icon={<TrendingUp className="w-4 h-4" />}
          subtitle="Valor gasto acima da média histórica do cliente"
          highlightColor="emerald"
        />

        <MetricCard
          title="Financiado pela Indústria"
          value={volumeIndustria}
          format="currency"
          icon={<Building2 className="w-4 h-4" />}
          subtitle="Descontos 100% bancados por Ambev, Nestlé, Danone, etc."
          highlightColor="emerald"
        />

        <MetricCard
          title="Compraram a Mais Hoje"
          value={pessoasCompraramMais}
          format="integer"
          icon={<Users className="w-4 h-4" />}
          subtitle="Clientes que expandiram a cesta por recomendação"
          highlightColor="emerald"
        />

        <MetricCard
          title="Ofertas Ativadas Hoje"
          value={ofertasAtivadas}
          format="integer"
          icon={<CheckCircle2 className="w-4 h-4" />}
          subtitle="Engajamento consciente do consumidor no app"
          highlightColor="emerald"
        />
      </div>

      {/* Comparative Basket Lift + Best Sellers Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        {/* Basket Comparison Card */}
        <div className="lg:col-span-2 rounded-2xl bg-zinc-900 border border-zinc-800 p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                Impacto no Ticket Médio da Rede
              </span>
              <h3 className="text-sm font-bold text-zinc-100 mt-0.5">
                Comparativo: Cesta Sem Oferta vs. Cesta Com Oferta
              </h3>
            </div>

            {/* Basket Lift Pill */}
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-sm">
              <ArrowUpRight className="w-4 h-4" />
              <span>+{aumentoCesta.toFixed(1)}% Basket Lift</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            {/* Sem Oferta */}
            <div className="rounded-xl bg-zinc-850 p-4 border border-zinc-750">
              <span className="text-xs text-zinc-400 font-medium block mb-1">
                Ticket Médio Sem Oferta
              </span>
              <AnimatedNumber
                value={ticketSemOferta}
                format="currency"
                className="text-2xl sm:text-3xl font-black text-zinc-300"
              />
              <p className="text-[11px] text-zinc-500 mt-1.5">
                Compras rotineiras sem ativação de benefício
              </p>
            </div>

            {/* Com Oferta */}
            <div className="rounded-xl bg-gradient-to-br from-emerald-950/40 to-zinc-850 p-4 border border-emerald-500/40 shadow-inner">
              <span className="text-xs text-emerald-400 font-medium block mb-1">
                Ticket Médio Com Oferta Ativada
              </span>
              <AnimatedNumber
                value={ticketComOferta}
                format="currency"
                className="text-2xl sm:text-3xl font-black text-emerald-300"
              />
              <p className="text-[11px] text-emerald-400/80 mt-1.5 font-medium">
                Cliente levou itens complementares e de maior margem
              </p>
            </div>
          </div>

          <p className="text-xs text-zinc-400 mt-3 pt-3 border-t border-zinc-800">
            *O motor preditivo identifica a probabilidade de compra e sugere o produto complementar certo, acelerando o giro e o ticket médio sem custo promocional para o varejista.
          </p>
        </div>

        {/* Top Product & Top Store Cards */}
        <div className="flex flex-col gap-3.5">
          {/* Top Product */}
          <div className="flex-1 rounded-2xl bg-zinc-900 border border-zinc-800 p-4 flex flex-col justify-between shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                Produto Mais Vendido do Dia
              </span>
            </div>
            <div>
              <h4 className="text-base font-bold text-zinc-100 truncate">
                {produtoTop.nome}
              </h4>
              <p className="text-xs text-zinc-400 mt-1">
                <strong className="text-zinc-100 font-semibold">{produtoTop.unidades}</strong> unidades comercializadas
              </p>
            </div>
            <div className="text-[11px] text-emerald-400/90 font-medium mt-2">
              Item com maior tração promocional no app
            </div>
          </div>

          {/* Top Store */}
          <div className="flex-1 rounded-2xl bg-zinc-900 border border-zinc-800 p-4 flex flex-col justify-between shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-cyan-400" />
                Loja Líder em Promoções
              </span>
            </div>
            <div>
              <h4 className="text-base font-bold text-zinc-100 truncate">
                {lojaTop.nome}
              </h4>
              <p className="text-xs text-zinc-400 mt-1">
                <strong className="text-zinc-100 font-semibold">{lojaTop.total_promocoes}</strong> ofertas ativas/resgatadas
              </p>
            </div>
            <div className="text-[11px] text-cyan-400/90 font-medium mt-2">
              Maior engajamento do Clube na região
            </div>
          </div>
        </div>
      </div>

      {/* Visual Conversion Funnel */}
      <FunnelChart funnel={metrics?.funil} />
    </div>
  );
}
