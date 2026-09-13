"use client";

/**
 * ===========================================================================
 * INTENTIONAL DECORATIVE AUTHENTICATION (FAKE AUTH)
 * ===========================================================================
 * As explicitly specified in Section 4.1 of the engineering requirements:
 * This login screen is purely decorative and scenographic for executive
 * presentations. It deliberately does NOT validate credentials against a
 * database or backend auth service, and accepts ANY username/password or
 * empty fields to ensure zero friction during the live meeting.
 * ===========================================================================
 */

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsTransitioning(true);
    // Smooth transition into dashboard
    setTimeout(() => {
      router.push("/dashboard");
    }, 450);
  };

  return (
    <div
      className={`min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-zinc-950 via-zinc-900 to-black relative overflow-hidden transition-opacity duration-500 ${
        isTransitioning ? "opacity-0 scale-95" : "opacity-100 scale-100"
      }`}
    >
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-md rounded-3xl bg-zinc-900/90 backdrop-blur-2xl border border-zinc-800 p-8 shadow-[0_20px_70px_rgba(0,0,0,0.8)] relative z-10">
        {/* Brand header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-emerald-950/60 mb-4 ring-1 ring-emerald-400/30">
            D
          </div>

          <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase mb-1">
            Plataforma Executiva
          </span>
          <h1 className="text-2xl font-black text-zinc-100 tracking-tight">
            Davita Intelligence Suite
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Motor de CRM Preditivo & Retail Media
          </p>
          <span className="inline-block mt-2 text-[11px] font-mono text-zinc-500 bg-zinc-800/60 px-2.5 py-0.5 rounded-full border border-zinc-700/40">
            by Parvus Space
          </span>
        </div>

        {/* Login form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 block">
              Usuário Executivo
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="diretoria@supermercadosdavita.com.br"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-750 text-zinc-100 text-xs placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/50 transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 block">
              Senha de Acesso
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-750 text-zinc-100 text-xs placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/50 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isTransitioning}
            className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 active:scale-[0.98] transition-all shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
          >
            <span>Acessar Painel Executivo</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Security badge note */}
        <div className="mt-6 pt-5 border-t border-zinc-800 flex items-center justify-center gap-2 text-[11px] text-zinc-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Ambiente de Demonstração Corporativa • Rede Davita</span>
        </div>
      </div>
    </div>
  );
}
