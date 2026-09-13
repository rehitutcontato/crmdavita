"use client";

import React, { useState } from "react";
import { Radar, Send, AlertTriangle, CheckCircle, ShieldAlert, Sparkles } from "lucide-react";
import { type ChurnAlert, type ChurnRadarMetrics, api } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";

interface ChurnRadarBlockProps {
  metrics?: ChurnRadarMetrics | null;
  alerts: ChurnAlert[];
  demoCPF: string;
  onCampaignTriggered?: (alertId: string) => void;
}

export function ChurnRadarBlock({
  metrics,
  alerts,
  demoCPF,
  onCampaignTriggered,
}: ChurnRadarBlockProps) {
  const [triggeringId, setTriggeringId] = useState<string | null>(null);
  const [triggeredIds, setTriggeredIds] = useState<Set<string>>(new Set());

  const handleTriggerCampaign = async (alert: ChurnAlert) => {
    if (triggeringId || triggeredIds.has(alert.id) || alert.status !== "ativo") return;
    try {
      setTriggeringId(alert.id);
      await api.triggerCampaign(alert.id);
      setTriggeredIds((prev) => new Set(prev).add(alert.id));
      if (onCampaignTriggered) {
        onCampaignTriggered(alert.id);
      }
    } catch (err) {
      console.error("Failed to trigger retention campaign:", err);
    } finally {
      setTriggeringId(null);
    }
  };

  const alertasAtivos = metrics?.alertas_ativos ?? alerts.filter((a) => a.status === "ativo").length;
  const campanhasDisparadas = metrics?.campanhas_disparadas_hoje ?? 0;

  return (
    <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5 shadow-lg space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-zinc-200 tracking-wide uppercase flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Bloco 3 — Radar de Churn Silencioso (Retenção Preditiva)
          </h2>
          <p className="text-xs text-zinc-500">
            Detecção antecipada de quebra de hábito de consumo por categoria antes do abandono definitivo
          </p>
        </div>

        {/* Counter Pills */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>
              <AnimatedNumber value={alertasAtivos} format="integer" /> Alertas Críticos
            </span>
          </div>

          <div className="px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
            <Send className="w-3.5 h-3.5" />
            <span>
              <AnimatedNumber value={campanhasDisparadas} format="integer" /> Disparadas Hoje
            </span>
          </div>
        </div>
      </div>

      {/* Alerts Table / List */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-400 uppercase text-[10px] tracking-wider">
              <th className="pb-2.5 font-semibold">Cliente</th>
              <th className="pb-2.5 font-semibold">Categoria em Risco</th>
              <th className="pb-2.5 font-semibold">Recência vs. Ciclo Esperado</th>
              <th className="pb-2.5 font-semibold">Desvio de Hábito</th>
              <th className="pb-2.5 font-semibold text-right">Ação Recomendada</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {alerts.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-zinc-500">
                  Nenhum alerta de churn crítico ativo no momento. Monitorando base 24/7...
                </td>
              </tr>
            ) : (
              alerts.map((alert) => {
                const isTriggered = triggeredIds.has(alert.id) || alert.status === "campanha_disparada";
                const isDemo = alert.customer_cpf === demoCPF;
                const isSevere = alert.deviation_ratio >= 2.0;

                return (
                  <tr
                    key={alert.id}
                    className={`transition-colors ${
                      isDemo ? "bg-emerald-500/5 hover:bg-emerald-500/10" : "hover:bg-zinc-850/60"
                    }`}
                  >
                    {/* Customer */}
                    <td className="py-3 pr-2">
                      <div className="font-semibold text-zinc-100 flex items-center gap-1.5">
                        <span>{alert.customer_name}</span>
                        {isDemo && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                            Demo App
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-zinc-500 font-mono">
                        {alert.customer_cpf}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="py-3 pr-2">
                      <Badge variant="zinc" size="sm">
                        {alert.category}
                      </Badge>
                    </td>

                    {/* Recency vs Cycle */}
                    <td className="py-3 pr-2">
                      <span className="font-bold text-amber-400">
                        {alert.days_since_last_purchase} dias
                      </span>{" "}
                      <span className="text-zinc-500">
                        (ciclo normal: {alert.expected_cycle_days}d)
                      </span>
                    </td>

                    {/* Deviation Ratio */}
                    <td className="py-3 pr-2">
                      <Badge
                        variant={isSevere ? "rose" : "amber"}
                        size="sm"
                        dot
                      >
                        +{alert.deviation_ratio.toFixed(2)}x desvio
                      </Badge>
                    </td>

                    {/* Action Button */}
                    <td className="py-3 text-right">
                      {isTriggered ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Campanha Disparada</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleTriggerCampaign(alert)}
                          disabled={triggeringId === alert.id}
                          className="px-3 py-1.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 active:scale-95 transition-all shadow-md shadow-amber-950/40 inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                        >
                          {triggeringId === alert.id ? (
                            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Disparar Push Retenção</span>
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="text-[11px] text-zinc-500 pt-2 border-t border-zinc-800/80 flex items-center justify-between">
        <span>
          💡 <strong>Dica para apresentação:</strong> Clique em "Disparar Push Retenção" no alerta do cliente Demo ({demoCPF}) para ver a notificação chegar instantaneamente no smartphone na Visão Cliente!
        </span>
      </div>
    </div>
  );
}
