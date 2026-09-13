"use client";

import React, { useState } from "react";
import { LiveStoreProvider, useLiveStore } from "@/hooks/useLiveStore";
import { NavSwitch, type ViewMode } from "@/components/NavSwitch";
import { PhoneFrame } from "@/components/app-cliente/PhoneFrame";
import { CustomerHeader } from "@/components/app-cliente/CustomerHeader";
import { OfferCard } from "@/components/app-cliente/OfferCard";
import { PushNotification } from "@/components/app-cliente/PushNotification";
import { SimulatePurchaseButton } from "@/components/app-cliente/SimulatePurchaseButton";
import { SimulationControls } from "@/components/diretoria/SimulationControls";
import { TraditionalBlock } from "@/components/diretoria/TraditionalBlock";
import { CRMRetailMediaBlock } from "@/components/diretoria/CRMRetailMediaBlock";
import { ChurnRadarBlock } from "@/components/diretoria/ChurnRadarBlock";
import { StorePerformanceTable } from "@/components/diretoria/StorePerformanceTable";
import { LiveTransactionFeed } from "@/components/diretoria/LiveTransactionFeed";
import { Skeleton } from "@/components/ui/Skeleton";
import { Sparkles, ShoppingBag } from "lucide-react";

function DashboardContent() {
  const {
    state,
    dispatch,
    refreshDashboard,
    refreshOffers,
    refreshAlerts,
    refreshStorePerformance,
  } = useLiveStore();

  const [viewMode, setViewMode] = useState<ViewMode>("diretoria");

  const {
    dashboard,
    storePerformance,
    churnAlerts,
    recentTransactions,
    customerOffers,
    demoCPF,
    connected,
    loading,
    pushNotification,
  } = state;

  const handleResetComplete = async () => {
    await Promise.all([
      refreshDashboard(),
      refreshOffers(),
      refreshAlerts(),
      refreshStorePerformance(),
    ]);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Navigation Switch Header */}
      <NavSwitch
        currentView={viewMode}
        onViewChange={setViewMode}
        wsConnected={connected}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 pb-12">
        {loading && !dashboard ? (
          <div className="space-y-6 pt-8">
            <Skeleton className="h-14 w-full" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <>
            {/* VIEW A: APP CLIENTE (CLUBE DAVITA) */}
            {viewMode === "cliente" && (
              <div className="py-4 flex flex-col items-center justify-center">
                <div className="mb-4 text-center">
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">
                    Visão A • Experiência do Consumidor
                  </span>
                  <h2 className="text-xl font-bold text-zinc-100 mt-0.5">
                    Aplicativo Clube Davita
                  </h2>
                  <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1">
                    Ativação consciente de ofertas preditivas baseadas na frequência e histórico do cliente.
                  </p>
                </div>

                <div className="relative">
                  <PhoneFrame>
                    <PushNotification
                      offer={pushNotification}
                      onDismiss={() => dispatch({ type: "DISMISS_PUSH" })}
                    />

                    <CustomerHeader
                      name="Mariana Oliveira Silva"
                      cpf={demoCPF || "342.***.***-89"}
                    />

                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                          Ofertas Recomendadas Para Você
                        </h3>
                        <span className="text-[10px] text-zinc-500">
                          {customerOffers.length} disponíveis
                        </span>
                      </div>

                      {customerOffers.length === 0 ? (
                        <div className="py-12 text-center text-zinc-500 text-xs">
                          Nenhuma oferta disponível no momento.
                        </div>
                      ) : (
                        customerOffers.map((offer) => (
                          <OfferCard
                            key={offer.id}
                            offer={offer}
                            onActivated={() => {
                              refreshDashboard();
                            }}
                          />
                        ))
                      )}

                      <SimulatePurchaseButton
                        customerCPF={demoCPF}
                        onPurchaseSimulated={() => {
                          refreshDashboard();
                          refreshOffers();
                        }}
                      />
                    </div>
                  </PhoneFrame>
                </div>
              </div>
            )}

            {/* VIEW B: PAINEL DA DIRETORIA (BI & CRM PREDITIVO) */}
            {viewMode === "diretoria" && (
              <div className="space-y-6">
                {/* Simulation controls toolbar */}
                <SimulationControls onResetComplete={handleResetComplete} />

                {/* Bloco 1 — Indicadores Tradicionais */}
                <TraditionalBlock metrics={dashboard?.tradicional} />

                {/* Bloco 2 — CRM Preditivo & Retail Media */}
                <CRMRetailMediaBlock
                  metrics={dashboard?.crm_preditivo_retail_media}
                />

                {/* Bloco 3 — Radar de Churn Silencioso */}
                <ChurnRadarBlock
                  metrics={dashboard?.churn_radar}
                  alerts={churnAlerts}
                  demoCPF={demoCPF}
                  onCampaignTriggered={() => {
                    refreshDashboard();
                    refreshAlerts();
                    refreshOffers();
                  }}
                />

                {/* Store Performance & Live Feeds */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <StorePerformanceTable stores={storePerformance} />
                  <LiveTransactionFeed transactions={recentTransactions} />
                </div>
              </div>
            )}

            {/* VIEW C: VISÃO DIVIDIDA (SPLIT / APRESENTAÇÃO LADO A LADO) */}
            {viewMode === "split" && (
              <div className="space-y-4">
                <SimulationControls onResetComplete={handleResetComplete} />

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                  {/* Left Column: Phone Frame */}
                  <div className="xl:col-span-4 flex flex-col items-center justify-start sticky top-24">
                    <div className="mb-2 text-center">
                      <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                        Visão Cliente (App)
                      </span>
                      <p className="text-[11px] text-zinc-400">
                        Interaja para ver o impacto no BI ao lado
                      </p>
                    </div>

                    <PhoneFrame>
                      <PushNotification
                        offer={pushNotification}
                        onDismiss={() => dispatch({ type: "DISMISS_PUSH" })}
                      />

                      <CustomerHeader
                        name="Mariana Oliveira Silva"
                        cpf={demoCPF || "342.***.***-89"}
                      />

                      <div className="p-3.5 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                            Ofertas Pessoais
                          </h3>
                        </div>

                        {customerOffers.map((offer) => (
                          <OfferCard
                            key={offer.id}
                            offer={offer}
                            onActivated={() => refreshDashboard()}
                          />
                        ))}

                        <SimulatePurchaseButton
                          customerCPF={demoCPF}
                          onPurchaseSimulated={() => {
                            refreshDashboard();
                            refreshOffers();
                          }}
                        />
                      </div>
                    </PhoneFrame>
                  </div>

                  {/* Right Column: Diretoria Dashboard */}
                  <div className="xl:col-span-8 space-y-6">
                    <TraditionalBlock metrics={dashboard?.tradicional} />

                    <CRMRetailMediaBlock
                      metrics={dashboard?.crm_preditivo_retail_media}
                    />

                    <ChurnRadarBlock
                      metrics={dashboard?.churn_radar}
                      alerts={churnAlerts}
                      demoCPF={demoCPF}
                      onCampaignTriggered={() => {
                        refreshDashboard();
                        refreshAlerts();
                        refreshOffers();
                      }}
                    />

                    <StorePerformanceTable stores={storePerformance} />

                    <LiveTransactionFeed transactions={recentTransactions} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <LiveStoreProvider>
      <DashboardContent />
    </LiveStoreProvider>
  );
}
