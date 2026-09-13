import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Davita Intelligence Suite — CRM Preditivo & Retail Media",
  description: "Plataforma Executiva de CRM Preditivo e Monetização Retail Media para a Rede Davita de Supermercados",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark h-full">
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100 antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
        {children}
      </body>
    </html>
  );
}
