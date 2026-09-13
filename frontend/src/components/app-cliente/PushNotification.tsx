"use client";

import React from "react";
import { Bell, X, Sparkles } from "lucide-react";
import { type Offer } from "@/lib/api";

interface PushNotificationProps {
  offer: Offer | null;
  onDismiss: () => void;
}

export function PushNotification({ offer, onDismiss }: PushNotificationProps) {
  if (!offer) return null;

  // Persuasive copy tailored by category and brand
  const getCopy = (o: Offer) => {
    switch (o.category.toLowerCase()) {
      case "bebidas":
        return `Sua geladeira merece uma ${o.sponsor_brand || "bebida gelada"} 🍺 Ative ${o.discount_pct}% OFF agora no app!`;
      case "laticínios":
        return `Seu laticínio favorito está te esperando 🥛 Ative ${o.discount_pct}% OFF exclusivo!`;
      case "higiene":
        return `Momento autocuidado com ${o.sponsor_brand || "produtos selecionados"} ✨ Garanta ${o.discount_pct}% de desconto!`;
      case "limpeza":
        return `Casa limpa e perfumada com ${o.sponsor_brand || "as melhores marcas"} 🧼 ${o.discount_pct}% OFF no seu CPF!`;
      case "hortifruti":
        return `Hortifruti fresquinho colhido hoje para você 🍎 Aproveite ${o.discount_pct}% OFF especial!`;
      case "mercearia":
        return `Café da manhã especial com desconto exclusivo ☕ Ative ${o.discount_pct}% OFF agora!`;
      default:
        return `Oferta exclusiva liberada para você! Ative ${o.discount_pct}% de desconto agora.`;
    }
  };

  return (
    <div className="absolute top-12 left-3 right-3 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="rounded-2xl bg-zinc-900/95 backdrop-blur-xl p-3.5 border border-emerald-500/40 shadow-2xl shadow-black/80 flex items-start gap-3">
        {/* App Icon */}
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-md shadow-emerald-950/50">
          D
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <span className="text-[11px] font-bold tracking-wider text-emerald-400 uppercase">
              Clube Davita • Agora
            </span>
            <span className="text-[10px] text-zinc-500">Notificação Push</span>
          </div>

          <p className="text-xs font-semibold text-zinc-100 leading-snug">
            Nova Oferta Preditiva Disponível!
          </p>
          <p className="text-[11px] text-zinc-300 mt-0.5 line-clamp-2">
            {getCopy(offer)}
          </p>
        </div>

        {/* Close button */}
        <button
          onClick={onDismiss}
          className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg hover:bg-zinc-800 transition shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
