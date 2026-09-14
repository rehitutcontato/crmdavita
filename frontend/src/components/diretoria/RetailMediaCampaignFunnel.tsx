"use client";

import React, { useState, useMemo } from "react";
import {
  Layers,
  Eye,
  CheckCircle2,
  Gift,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Percent,
  Sparkles,
  Info,
} from "lucide-react";
import { type CRMRetailMediaMetrics, type Transaction } from "@/lib/api";

interface ProductCampaignData {
  id: string;
  name: string;
  category: string;
  sponsor: string;
  brandColor: string;
  views: number;
  activations: number;
  redemptions: number;
  unitPrice: number;
  discountPct: number;
  incrementalLiftPct: number;
  marginProtectedPct: number;
}

const CAMPAIGN_PRODUCTS_BASE: ProductCampaignData[] = [
  {
    id: "prod-1",
    name: "Cerveja Brahma Lata 350ml",
    category: "bebidas",
    sponsor: "Ambev",
    brandColor: "from-amber-500 to-yellow-600 border-amber-500/30 text-amber-300",
    views: 1480,
    activations: 710,
    redemptions: 438,
    unitPrice: 3.49,
    discountPct: 15,
    incrementalLiftPct: 32.4,
    marginProtectedPct: 38.3,
  },
  {
    id: "prod-18",
    name: "Sabão em Pó OMO 1.6kg",
    category: "limpeza",
    sponsor: "Unilever",
    brandColor: "from-blue-500 to-indigo-600 border-blue-500/30 text-blue-300",
    views: 1220,
    activations: 560,
    redemptions: 342,
    unitPrice: 22.9,
    discountPct: 18,
    incrementalLiftPct: 27.8,
    marginProtectedPct: 38.9,
  },
  {
    id: "prod-6",
    name: "Leite Integral Ninho 1L",
    category: "laticínios",
    sponsor: "Nestlé",
    brandColor: "from-red-500 to-rose-600 border-red-500/30 text-rose-300",
    views: 1050,
    activations: 512,
    redemptions: 348,
    unitPrice: 6.49,
    discountPct: 12,
    incrementalLiftPct: 24.1,
    marginProtectedPct: 32.0,
  },
  {
    id: "prod-3",
    name: "Red Bull Energy Drink 250ml",
    category: "bebidas",
    sponsor: "Red Bull",
    brandColor: "from-cyan-500 to-blue-600 border-cyan-500/30 text-cyan-300",
    views: 890,
    activations: 445,
    redemptions: 289,
    unitPrice: 9.99,
    discountPct: 15,
    incrementalLiftPct: 38.6,
    marginProtectedPct: 35.1,
  },
  {
    id: "prod-7",
    name: "Iogurte Danone Natural 170g",
    category: "laticínios",
    sponsor: "Danone",
    brandColor: "from-sky-500 to-teal-600 border-sky-500/30 text-sky-300",
    views: 810,
    activations: 375,
    redemptions: 224,
    unitPrice: 3.99,
    discountPct: 15,
    incrementalLiftPct: 21.5,
    marginProtectedPct: 40.3,
  },
];

interface RetailMediaCampaignFunnelProps {
  metrics?: CRMRetailMediaMetrics | null;
  recentTransactions?: Transaction[];
}

export function RetailMediaCampaignFunnel({
  metrics,
  recentTransactions = [],
}: RetailMediaCampaignFunnelProps) {
  const [viewMode, setViewMode] = useState<"volume" | "rate">("volume");
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);

  // Dynamically blend live transaction increments into the campaign numbers
  const campaignData = useMemo(() => {
    const extraRedemptions = recentTransactions.filter((t) => t.linked_offer_id).length;
    return CAMPAIGN_PRODUCTS_BASE.map((item, idx) => {
      const addedRedeem = idx === 0 ? extraRedemptions : Math.floor(extraRedemptions / (idx + 1));
      const redemptions = item.redemptions + addedRedeem;
      const activations = item.activations + Math.floor(addedRedeem * 1.4);
      const views = item.views + Math.floor(addedRedeem * 2.8);

      const volumeViews = views * item.unitPrice * 1.8;
      const volumeActivations = activations * item.unitPrice * 1.5;
      const volumeRedemptions = redemptions * item.unitPrice * 2.2;

      const actRate = (activations / views) * 100;
      const redeemRate = (redemptions / activations) * 100;
      const globalRate = (redemptions / views) * 100;

      // Breakage savings funded by industry: margin preserved by non-redeemed opt-ins
      const industrySubsidy = redemptions * item.unitPrice * (item.discountPct / 100);
      const marginShieldedReais = (activations - redemptions) * item.unitPrice * 0.45;

      return {
        ...item,
        views,
        activations,
        redemptions,
        volumeViews,
        volumeActivations,
        volumeRedemptions,
        actRate,
        redeemRate,
        globalRate,
        industrySubsidy,
        marginShieldedReais,
      };
    });
  }, [recentTransactions]);

  const maxVolume = useMemo(() => {
    return Math.max(...campaignData.map((d) => d.volumeViews), 1);
  }, [campaignData]);

  return (
    <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5 shadow-xl space-y-5">
      {/* Header & Toggle Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Layers className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-zinc-100 tracking-wide uppercase">
              Funil de Conversão & Produtos Mais Clicados • Retail Media
            </h3>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Auditoria comparativa entre Visualizações no App, Ativações no CPF e Resgate em Frente de Caixa (PDV)
          </p>
        </div>

        {/* View Switcher: Volume (R$) vs Taxa (%) */}
        <div className="flex items-center gap-1 bg-zinc-950/80 p-1 rounded-xl border border-zinc-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode("volume")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === "volume"
                ? "bg-emerald-500 text-zinc-950 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Volume em R$</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("rate")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === "rate"
                ? "bg-emerald-500 text-zinc-950 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>Taxas de Conversão</span>
          </button>
        </div>
      </div>

      {/* Legend & Pipeline Stages Indicator */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-zinc-950/50 p-3 rounded-xl border border-zinc-850 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-cyan-500/80 border border-cyan-400/40" />
          <div>
            <span className="font-semibold text-zinc-300">1. Visualizações no App</span>
            <p className="text-[10px] text-zinc-500">Impressões em carrosséis e banners</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-emerald-500/80 border border-emerald-400/40" />
          <div>
            <span className="font-semibold text-emerald-300">2. Ofertas Ativadas no CPF</span>
            <p className="text-[10px] text-zinc-500">Opt-in consciente do cliente no app</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-violet-500/80 border border-violet-400/40" />
          <div>
            <span className="font-semibold text-violet-300">3. Resgates Concluídos (PDV)</span>
            <p className="text-[10px] text-zinc-500">Item liquidado no checkout físico</p>
          </div>
        </div>
      </div>

      {/* Interactive Horizontal Bars per Top Product */}
      <div className="space-y-4">
        {campaignData.map((prod) => {
          const isHovered = hoveredProduct === prod.id;

          // Bar Widths
          const viewWidth = viewMode === "volume" ? (prod.volumeViews / maxVolume) * 100 : 100;
          const actWidth =
            viewMode === "volume"
              ? (prod.volumeActivations / maxVolume) * 100
              : prod.actRate;
          const redeemWidth =
            viewMode === "volume"
              ? (prod.volumeRedemptions / maxVolume) * 100
              : prod.globalRate;

          return (
            <div
              key={prod.id}
              onMouseEnter={() => setHoveredProduct(prod.id)}
              onMouseLeave={() => setHoveredProduct(null)}
              className={`p-3.5 rounded-xl border transition-all duration-200 ${
                isHovered
                  ? "bg-zinc-850/90 border-emerald-500/40 shadow-lg shadow-emerald-950/20"
                  : "bg-zinc-850/40 border-zinc-800/80 hover:border-zinc-700"
              }`}
            >
              {/* Product Header & Sponsor Badge */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-100">{prod.name}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-gradient-to-r border ${prod.brandColor}`}
                  >
                    Patrocínio: {prod.sponsor}
                  </span>
                </div>

                {/* Margin Protection Pill (Breakage Metric) */}
                <div className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-semibold">
                    Margem Protegida: {prod.marginProtectedPct.toFixed(1)}%
                  </span>
                  <span className="text-zinc-500 hidden sm:inline">•</span>
                  <span className="text-zinc-400 hidden sm:inline">
                    R$ {prod.marginShieldedReais.toFixed(2)} preservados
                  </span>
                </div>
              </div>

              {/* Stacked Interactive Horizontal Funnel Bars */}
              <div className="space-y-1.5">
                {/* 1. Views Bar */}
                <div className="space-y-0.5">
                  <div className="flex justify-between text-[11px] text-zinc-400">
                    <span className="flex items-center gap-1 text-cyan-400">
                      <Eye className="w-3 h-3" /> Visualizações
                    </span>
                    <span className="font-mono font-bold text-zinc-200">
                      {viewMode === "volume"
                        ? `R$ ${prod.volumeViews.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                        : `${prod.views} views (100%)`}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(5, Math.min(100, viewWidth))}%` }}
                    />
                  </div>
                </div>

                {/* 2. Activations Bar */}
                <div className="space-y-0.5">
                  <div className="flex justify-between text-[11px] text-zinc-400">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" /> Ativações no CPF
                    </span>
                    <span className="font-mono font-bold text-emerald-300">
                      {viewMode === "volume"
                        ? `R$ ${prod.volumeActivations.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                        : `${prod.activations} ativadas (${prod.actRate.toFixed(1)}% CTR)`}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(5, Math.min(100, actWidth))}%` }}
                    />
                  </div>
                </div>

                {/* 3. Redemptions Bar */}
                <div className="space-y-0.5">
                  <div className="flex justify-between text-[11px] text-zinc-400">
                    <span className="flex items-center gap-1 text-violet-400">
                      <Gift className="w-3 h-3" /> Resgates no Caixa (PDV)
                    </span>
                    <span className="font-mono font-bold text-violet-300">
                      {viewMode === "volume"
                        ? `R$ ${prod.volumeRedemptions.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                        : `${prod.redemptions} resgates (${prod.globalRate.toFixed(1)}% conversão global)`}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                    <div
                      className="h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(5, Math.min(100, redeemWidth))}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Subsidized Breakdown & Lift KPI */}
              <div className="mt-2.5 pt-2 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    Lift Incremental na Cesta:{" "}
                    <strong className="text-emerald-300">+{prod.incrementalLiftPct}%</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    Subsídio Indústria ({prod.sponsor}):{" "}
                    <strong className="text-amber-300 font-mono">
                      R$ {prod.industrySubsidy.toFixed(2)}
                    </strong>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Strategic Footer Note */}
      <div className="rounded-xl bg-zinc-950/60 p-3 border border-zinc-800 flex items-start gap-2.5 text-xs text-zinc-400">
        <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-zinc-200">
            Mecanismo de Breakage & Monetização de Retail Media:
          </span>{" "}
          O varejo monetiza tanto no giro incrementado quanto na venda de espaços de visibilidade (Retail Media). 
          O cliente só resgata se for até a loja física em até 48h, protegendo a rede contra descontos passivos e transferindo 100% do custo promocional para a verba de trade marketing das indústrias parceiras.
        </div>
      </div>
    </div>
  );
}
