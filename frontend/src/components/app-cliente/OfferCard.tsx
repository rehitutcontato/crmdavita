"use client";

import React, { useState } from "react";
import { CheckCircle2, Zap, Clock, ShieldAlert, Sparkles, Building2 } from "lucide-react";
import { type Offer, api } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";

interface OfferCardProps {
  offer: Offer;
  onActivated?: (offer: Offer) => void;
}

export function OfferCard({ offer, onActivated }: OfferCardProps) {
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<Offer["status"]>(offer.status);

  // Sync state if prop changes
  React.useEffect(() => {
    setCurrentStatus(offer.status);
  }, [offer.status]);

  const handleActivate = async () => {
    if (loading || currentStatus !== "disparada") return;
    try {
      setLoading(true);
      await api.activateOffer(offer.id);
      setCurrentStatus("ativada");
      if (onActivated) {
        onActivated({ ...offer, status: "ativada" });
      }
    } catch (err) {
      console.error("Failed to activate offer:", err);
    } finally {
      setLoading(false);
    }
  };

  // Category labels and icons mapping
  const categoryInfo: Record<string, { label: string; icon: string }> = {
    bebidas: { label: "Bebidas & Cervejas", icon: "🍺" },
    laticínios: { label: "Laticínios & Queijos", icon: "🥛" },
    higiene: { label: "Higiene & Perfumaria", icon: "🧴" },
    limpeza: { label: "Limpeza & Casa", icon: "🧼" },
    hortifruti: { label: "Hortifruti & Orgânicos", icon: "🍎" },
    mercearia: { label: "Mercearia & Matinais", icon: "☕" },
  };

  const catMeta = categoryInfo[offer.category.toLowerCase()] || {
    label: offer.category,
    icon: "🏷️",
  };

  const isActivated = currentStatus === "ativada";
  const isRedeemed = currentStatus === "resgatada";
  const isExpired = currentStatus === "expirada";

  return (
    <div
      className={`rounded-2xl p-4 transition-all duration-300 relative overflow-hidden border ${
        isActivated
          ? "bg-gradient-to-br from-emerald-950/40 via-zinc-900 to-zinc-900 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
          : isRedeemed
          ? "bg-zinc-900/60 border-zinc-800 opacity-75"
          : "bg-zinc-900 border-zinc-800 hover:border-zinc-700 shadow-md"
      }`}
    >
      {/* Top badges: Sponsor Brand + Category */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="text-base">{catMeta.icon}</span>
          <span className="text-xs font-medium text-zinc-300">
            {catMeta.label}
          </span>
        </div>

        {offer.sponsor_brand && (
          <Badge variant="cyan" size="sm">
            <Building2 className="w-3 h-3" />
            <span>{offer.sponsor_brand}</span>
          </Badge>
        )}
      </div>

      {/* Main offer highlight */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
            <span>{offer.discount_pct}% de Desconto Exclusivo</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Válido em toda a linha de {offer.category}
          </p>
        </div>

        {/* Discount Badge */}
        <div className="px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-extrabold text-sm flex items-center gap-1 shrink-0">
          <Zap className="w-3.5 h-3.5 fill-emerald-400" />
          <span>-{offer.discount_pct}%</span>
        </div>
      </div>

      {/* Action / State Area */}
      {currentStatus === "disparada" && (
        <div className="space-y-2">
          <button
            onClick={handleActivate}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 active:scale-[0.98] transition-all shadow-md shadow-emerald-950/50 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Ativar Oferta no Meu CPF</span>
              </>
            )}
          </button>
          <p className="text-[10px] text-zinc-500 text-center leading-tight">
            *Opt-in voluntário: desconto creditado direto no caixa pelo CPF
          </p>
        </div>
      )}

      {isActivated && (
        <div className="space-y-2">
          <div className="py-2 px-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-2 text-emerald-300 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Oferta Ativada! Válida automaticamente no caixa pelo CPF</span>
          </div>
          <div className="text-[10px] text-emerald-500/80 bg-emerald-950/30 rounded-lg p-2 border border-emerald-800/20">
            <strong>Mecânica de Opt-in:</strong> Ativação consciente pelo cliente. Margem da rede blindada por breakage.
          </div>
        </div>
      )}

      {isRedeemed && (
        <div className="py-2 px-3 rounded-xl bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-between text-xs text-zinc-400">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-zinc-500" />
            <span>Oferta Resgatada no Caixa</span>
          </span>
          {offer.incremental_value && offer.incremental_value > 0 && (
            <span className="text-[11px] text-emerald-400 font-semibold">
              +R$ {offer.incremental_value.toFixed(2)} cesta
            </span>
          )}
        </div>
      )}

      {isExpired && (
        <div className="py-2 px-3 rounded-xl bg-zinc-800/40 border border-zinc-800 flex items-center gap-2 text-xs text-zinc-500">
          <Clock className="w-3.5 h-3.5" />
          <span>Oferta expirada</span>
        </div>
      )}
    </div>
  );
}
