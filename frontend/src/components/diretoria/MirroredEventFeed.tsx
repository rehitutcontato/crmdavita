"use client";

import React, { useState } from "react";
import {
  Smartphone,
  Store,
  Clock,
  CheckCircle2,
  Tag,
  ArrowRight,
  Zap,
  Activity,
  Sparkles,
  MapPin,
  ShoppingBag,
} from "lucide-react";
import { type MobileActivation, type Transaction } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";

interface MirroredEventFeedProps {
  activations?: MobileActivation[];
  transactions?: Transaction[];
}

export function MirroredEventFeed({
  activations = [],
  transactions = [],
}: MirroredEventFeedProps) {
  const [selectedCorrelationId, setSelectedCorrelationId] = useState<string | null>(null);

  // Match activations with transactions that redeemed them
  const correlatedMap = React.useMemo(() => {
    const map = new Map<string, string>(); // activation_id -> txn_id
    for (const txn of transactions) {
      if (txn.linked_activation_id) {
        map.set(txn.linked_activation_id, txn.id);
      }
    }
    return map;
  }, [transactions]);

  return (
    <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5 shadow-xl space-y-5">
      {/* Header & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Zap className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-zinc-100 tracking-wide uppercase">
              Feed Espelhado de Causa e Efeito • Ativação Mobile vs. Liquidação no Caixa
            </h3>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Rastreamento síncrono em tempo real: da ativação pessoal no app à passagem física no frente de caixa (PDV)
          </p>
        </div>

        {/* Live Status Chip */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-emerald-400 font-semibold">Duplo Fluxo ao Vivo</span>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-400">Ciclo Médio: ~18 min</span>
        </div>
      </div>

      {/* Dual Synchronized Columns Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column: Live Mobile Activations */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                1. Ativações no App ao Vivo
              </h4>
            </div>
            <span className="text-[11px] text-zinc-500 font-mono">
              {activations.length} eventos recentes
            </span>
          </div>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {activations.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-500 rounded-xl bg-zinc-950/40 border border-zinc-850">
                Aguardando ativações de cupons pelos clientes no app...
              </div>
            ) : (
              activations.slice(0, 7).map((act) => {
                const isCorrelated = correlatedMap.has(act.id) || act.liquidated;
                const isSelected = selectedCorrelationId === act.id;
                const timeStr = act.timestamp
                  ? new Date(act.timestamp).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })
                  : "agora";

                return (
                  <div
                    key={act.id}
                    onClick={() =>
                      setSelectedCorrelationId(isSelected ? null : act.id)
                    }
                    className={`p-3 rounded-xl border transition-all text-xs cursor-pointer ${
                      isSelected
                        ? "bg-emerald-950/40 border-emerald-500 shadow-md ring-1 ring-emerald-500/50"
                        : isCorrelated
                        ? "bg-zinc-850/80 border-emerald-500/30 hover:border-emerald-500/60"
                        : "bg-zinc-950/60 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      {/* Left info */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono font-bold text-emerald-400 text-[11px]">
                            {act.id}
                          </span>
                          <span className="text-zinc-600">•</span>
                          <span className="font-mono text-zinc-400 text-[11px]">
                            {act.customer_cpf}
                          </span>
                          <span className="text-zinc-500 text-[10px] hidden sm:inline">
                            ({act.customer_name})
                          </span>
                        </div>

                        <div className="font-semibold text-zinc-100 text-xs">
                          {act.product_name}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-zinc-400">
                          <span className="flex items-center gap-1 text-zinc-400">
                            <MapPin className="w-3 h-3 text-zinc-500" />
                            {act.neighborhood} ({act.distance_km.toFixed(1)} km)
                          </span>
                          <span className="text-zinc-600">•</span>
                          <span className="text-zinc-400">{act.store_name.split("-")[0]}</span>
                        </div>
                      </div>

                      {/* Right: Badge & Time */}
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <div className="flex items-center gap-1 font-mono text-[10px] text-zinc-500">
                          <Clock className="w-3 h-3 text-zinc-500" />
                          <span>{timeStr}</span>
                        </div>

                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                          -{act.discount_pct}% • {act.sponsor_brand}
                        </div>

                        {isCorrelated && (
                          <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Liquidado no PDV
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Live Checkout Transactions */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <Store className="w-4 h-4 text-violet-400" />
              <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                2. Transações nos Caixas (PDV) ao Vivo
              </h4>
            </div>
            <span className="text-[11px] text-zinc-500 font-mono">
              {transactions.length} emitidas
            </span>
          </div>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {transactions.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-500 rounded-xl bg-zinc-950/40 border border-zinc-850">
                Aguardando leitura de código de barras nos PDVs...
              </div>
            ) : (
              transactions.slice(0, 7).map((txn) => {
                const isCorrelated = Boolean(txn.linked_activation_id);
                const isSelected =
                  selectedCorrelationId === txn.linked_activation_id;
                const timeStr = txn.timestamp
                  ? new Date(txn.timestamp).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })
                  : "agora";

                const itemCount = txn.items.reduce((acc, it) => acc + it.qty, 0);

                return (
                  <div
                    key={txn.id}
                    onClick={() =>
                      txn.linked_activation_id &&
                      setSelectedCorrelationId(
                        isSelected ? null : txn.linked_activation_id
                      )
                    }
                    className={`p-3 rounded-xl border transition-all text-xs cursor-pointer ${
                      isSelected
                        ? "bg-violet-950/40 border-violet-500 shadow-md ring-1 ring-violet-500/50"
                        : isCorrelated
                        ? "bg-zinc-850/80 border-violet-500/30 hover:border-violet-500/60"
                        : "bg-zinc-950/60 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      {/* Left info */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono font-bold text-violet-400 text-[11px]">
                            {txn.pos_id || "PDV #01"}
                          </span>
                          <span className="text-zinc-600">•</span>
                          <span className="font-bold text-zinc-300 uppercase text-[11px]">
                            {txn.store_id}
                          </span>
                        </div>

                        <div className="text-zinc-200 font-medium">
                          {itemCount} {itemCount === 1 ? "item comprado" : "itens na cesta"}
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                          {txn.used_club_cpf ? (
                            <Badge variant="emerald" size="sm">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>CPF Clube</span>
                            </Badge>
                          ) : (
                            <Badge variant="zinc" size="sm">
                              <span>Sem CPF</span>
                            </Badge>
                          )}

                          {txn.linked_activation_id && (
                            <div className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-violet-500/20 text-violet-300 border border-violet-500/40">
                              <Zap className="w-3 h-3 text-violet-400" />
                              <span>Vínculo: {txn.linked_activation_id}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Value & Time */}
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <div className="flex items-center gap-1 font-mono text-[10px] text-zinc-500">
                          <Clock className="w-3 h-3 text-zinc-500" />
                          <span>{timeStr}</span>
                        </div>

                        <div className="text-sm font-black text-zinc-100 font-mono">
                          R$ {txn.total_value.toFixed(2)}
                        </div>

                        {txn.linked_activation_id && (
                          <span className="text-[10px] text-violet-400 font-bold flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            Desconto Aplicado
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Synchronized Loop Callout Banner */}
      <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/30 via-zinc-950 to-violet-950/30 border border-zinc-800 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-zinc-300">
            <strong>Demonstração Executiva:</strong> Quando um cupom é ativado no app à esquerda, o motor simula a rota física do consumidor e efetiva a passagem no checkout à direita segundos depois, demonstrando a correlação exata entre o estímulo digital e a venda física.
          </span>
        </div>
        <div className="shrink-0 font-mono text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
          Sync: 100%
        </div>
      </div>
    </div>
  );
}
