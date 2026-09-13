"use client";

import React from "react";
import { Activity, Clock, ShoppingCart, Tag, CheckCircle2 } from "lucide-react";
import { type Transaction } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";

interface LiveTransactionFeedProps {
  transactions: Transaction[];
}

export function LiveTransactionFeed({ transactions }: LiveTransactionFeedProps) {
  return (
    <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-zinc-200 tracking-wide uppercase flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Feed de Transações nos Caixas (PDV) ao Vivo
          </h2>
          <p className="text-xs text-zinc-500">
            Últimas compras processadas em tempo real via WebSocket
          </p>
        </div>
        <span className="text-[11px] text-zinc-500 flex items-center gap-1 font-mono">
          <Activity className="w-3 h-3 text-emerald-400" />
          Transmitindo
        </span>
      </div>

      <div className="space-y-2">
        {transactions.length === 0 ? (
          <div className="py-6 text-center text-zinc-500 text-xs">
            Aguardando novas transações dos caixas...
          </div>
        ) : (
          transactions.slice(0, 5).map((txn) => {
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
                className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-zinc-850/80 border border-zinc-800 hover:border-zinc-700/80 transition-all text-xs"
              >
                {/* Left: Time + Store + Items */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-zinc-500 font-mono text-[11px]">
                    <Clock className="w-3 h-3 text-zinc-400" />
                    <span>{timeStr}</span>
                  </div>

                  <div>
                    <span className="font-semibold text-zinc-200 uppercase text-[11px]">
                      {txn.store_id}
                    </span>
                    <span className="text-zinc-500 mx-1.5">•</span>
                    <span className="text-zinc-400">
                      {itemCount} {itemCount === 1 ? "item" : "itens"}
                    </span>
                  </div>
                </div>

                {/* Right: Badges + Total Value */}
                <div className="flex items-center gap-2">
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

                  {txn.linked_offer_id && (
                    <Badge variant="violet" size="sm">
                      <Tag className="w-3 h-3" />
                      <span>Oferta Resgatada</span>
                    </Badge>
                  )}

                  <span className="font-bold text-zinc-100 text-sm ml-2 font-mono">
                    R$ {txn.total_value.toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
