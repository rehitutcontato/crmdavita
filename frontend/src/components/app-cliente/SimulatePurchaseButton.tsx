"use client";

import React, { useState } from "react";
import { ShoppingCart, Check, Sparkles } from "lucide-react";
import { api } from "@/lib/api";

interface SimulatePurchaseButtonProps {
  customerCPF: string;
  onPurchaseSimulated?: (result: { total_value: number; transaction_id: string }) => void;
}

export function SimulatePurchaseButton({
  customerCPF,
  onPurchaseSimulated,
}: SimulatePurchaseButtonProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [lastValue, setLastValue] = useState<number | null>(null);

  const handleSimulate = async () => {
    if (loading || !customerCPF) return;
    try {
      setLoading(true);
      const res = await api.simulatePurchase(customerCPF);
      setLastValue(res.total_value);
      setSuccess(true);
      if (onPurchaseSimulated) {
        onPurchaseSimulated(res);
      }
      setTimeout(() => {
        setSuccess(false);
      }, 4000);
    } catch (err) {
      console.error("Failed to simulate purchase:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-2">
      <button
        onClick={handleSimulate}
        disabled={loading}
        className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold border transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-md ${
          success
            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
            : "bg-zinc-800/90 hover:bg-zinc-750 border-zinc-700/80 text-zinc-200 hover:text-white"
        }`}
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
        ) : success ? (
          <>
            <Check className="w-4 h-4 text-emerald-400" />
            <span>
              Compra Realizada no Caixa! R$ {lastValue?.toFixed(2)}
            </span>
          </>
        ) : (
          <>
            <ShoppingCart className="w-4 h-4 text-emerald-400" />
            <span>Simular Compra no Caixa (PDV)</span>
          </>
        )}
      </button>
      <p className="text-[10px] text-zinc-500 text-center mt-1">
        Aperte para forçar uma transação com CPF no caixa e ver o resgate no BI
      </p>
    </div>
  );
}
