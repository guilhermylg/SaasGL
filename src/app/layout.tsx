import type { Metadata } from "next";
import { Montserrat, Inter } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "StatPitch — Gestão de Escolinha de Futebol & Locação de Quadras",
  description:
    "Plataforma SportTech para gestão de escolinhas de futebol e locação de quadras sem conflitos, com matrícula digital e pagamentos Stripe.",
  keywords: [
    "escolinha de futebol",
    "aluguel de quadra",
    "gestão esportiva",
    "mensalidades",
    "stripe",
    "futebol society",
    "sporttech",
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
      <body className="min-h-screen bg-slate-50 text-slate-900 selection:bg-emerald-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
