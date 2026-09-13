"use client";

import React from "react";
import { Smartphone, LayoutDashboard, Columns, Wifi, WifiOff } from "lucide-react";

export type ViewMode = "cliente" | "diretoria" | "split";

interface NavSwitchProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  wsConnected: boolean;
}

export function NavSwitch({
  currentView,
  onViewChange,
  wsConnected,
}: NavSwitchProps) {
  return (
    <header className="sticky top-4 z-40 px-4 mb-6">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 p-2 rounded-2xl bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 shadow-2xl">
        {/* Brand identity */}
        <div className="flex items-center gap-3 pl-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center font-extrabold text-white text-sm shadow-md shadow-emerald-950/60">
            D
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wider text-zinc-100 uppercase">
                Davita Intelligence Suite
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 font-mono">
                v1.0
              </span>
            </div>
            <p className="text-[10px] text-zinc-500">
              by Parvus Space • CRM Preditivo & Retail Media
            </p>
          </div>
        </div>

        {/* 2-Position Segmented Control (+ Split option) */}
        <div className="flex items-center p-1 bg-zinc-950 rounded-xl border border-zinc-800 shadow-inner">
          <button
            onClick={() => onViewChange("cliente")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              currentView === "cliente"
                ? "bg-zinc-800 text-emerald-400 shadow-md border border-zinc-700/60"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>App Cliente (Clube Davita)</span>
          </button>

          <button
            onClick={() => onViewChange("diretoria")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              currentView === "diretoria"
                ? "bg-zinc-800 text-cyan-400 shadow-md border border-zinc-700/60"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Diretoria (BI & CRM Preditivo)</span>
          </button>

          <button
            onClick={() => onViewChange("split")}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              currentView === "split"
                ? "bg-zinc-800 text-amber-400 shadow-md border border-zinc-700/60"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
            title="Visão Dividida lado a lado (ideal para apresentações)"
          >
            <Columns className="w-3.5 h-3.5" />
            <span className="text-[11px]">Lado a Lado</span>
          </button>
        </div>

        {/* WebSocket Connection Status Pill */}
        <div className="flex items-center gap-2 pr-2">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
              wsConnected
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
            }`}
          >
            {wsConnected ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <Wifi className="w-3 h-3" />
                <span className="hidden sm:inline">WebSocket Conectado</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <WifiOff className="w-3 h-3" />
                <span>Reconectando...</span>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
