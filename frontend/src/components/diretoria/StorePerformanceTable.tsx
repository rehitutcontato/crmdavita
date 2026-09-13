"use client";

import React from "react";
import { Store, TrendingUp, Tag, Gift } from "lucide-react";
import { type StorePerformance } from "@/lib/api";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Badge } from "@/components/ui/Badge";

interface StorePerformanceTableProps {
  stores: StorePerformance[];
}

export function StorePerformanceTable({ stores }: StorePerformanceTableProps) {
  return (
    <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5 shadow-lg space-y-4">
      <div>
        <h2 className="text-sm font-bold text-zinc-200 tracking-wide uppercase flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          Desempenho por Loja da Rede Davita
        </h2>
        <p className="text-xs text-zinc-500">
          Acompanhamento em tempo real de faturamento, fluxo de clientes e penetração das ofertas nas 6 unidades
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-400 uppercase text-[10px] tracking-wider">
              <th className="pb-2.5 font-semibold">Unidade</th>
              <th className="pb-2.5 font-semibold">Faturamento Hoje</th>
              <th className="pb-2.5 font-semibold">Cupons Emitidos</th>
              <th className="pb-2.5 font-semibold">Ticket Médio</th>
              <th className="pb-2.5 font-semibold">Ofertas Ativas</th>
              <th className="pb-2.5 font-semibold text-right">Ofertas Resgatadas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {stores.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-zinc-500">
                  Carregando dados das unidades...
                </td>
              </tr>
            ) : (
              stores.map((store) => {
                const ticketMedio =
                  store.cupons > 0 ? store.faturamento / store.cupons : 0;

                return (
                  <tr key={store.store_id} className="hover:bg-zinc-850/50 transition-colors">
                    <td className="py-3 pr-2">
                      <div className="font-semibold text-zinc-100 flex items-center gap-2">
                        <Store className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{store.store_name}</span>
                      </div>
                      <span className="text-[11px] text-zinc-500 font-mono">
                        {store.store_id}
                      </span>
                    </td>

                    <td className="py-3 pr-2 font-bold text-zinc-100">
                      <AnimatedNumber value={store.faturamento} format="currency" />
                    </td>

                    <td className="py-3 pr-2 font-medium text-zinc-300">
                      <AnimatedNumber value={store.cupons} format="integer" />
                    </td>

                    <td className="py-3 pr-2 font-medium text-cyan-400">
                      <AnimatedNumber value={ticketMedio} format="currency" />
                    </td>

                    <td className="py-3 pr-2">
                      <Badge variant="cyan" size="sm">
                        <Tag className="w-3 h-3" />
                        <span>{store.promocoes_ativas} ativas</span>
                      </Badge>
                    </td>

                    <td className="py-3 text-right">
                      <Badge variant="emerald" size="sm">
                        <Gift className="w-3 h-3" />
                        <span>{store.promocoes_resgatadas} resgates</span>
                      </Badge>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
