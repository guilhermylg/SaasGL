import type { Metadata } from "next";
import { Montserrat, Inter } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ArenaGL — Gestão de Escolinha de Futebol & Locação de Quadras",
  description:
    "Plataforma SportTech para gestão integrada de escolinhas de futebol, locação de quadras sem conflitos, matrícula digital e conciliação bancária manual via PIX.",
  keywords: [
    "escolinha de futebol",
    "aluguel de quadra",
    "gestão esportiva",
    "mensalidades",
    "conciliação bancária",
    "pix",
    "futebol society",
    "arenagl",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${montserrat.variable} antialiased`}
    >
      <body className="min-h-screen text-slate-900 selection:bg-emerald-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
