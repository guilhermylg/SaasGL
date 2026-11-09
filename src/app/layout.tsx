import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "StatPitch — Gestão de Escolinha de Futebol & Locação de Quadras",
  description:
    "Plataforma SaaS híbrida para gestão de escolinhas de futebol (categorias Sub, matrícula online via WhatsApp, mensalidades Stripe) e agenda de locação de quadras sem conflito de horários.",
  keywords: [
    "escolinha de futebol",
    "aluguel de quadra",
    "gestão esportiva",
    "mensalidade escolar",
    "stripe",
    "quadra society",
  ],
  openGraph: {
    title: "StatPitch — Gestão de Escolinha de Futebol & Locação de Quadras",
    description:
      "Unifique as turmas da sua escolinha e a locação da sua quadra em uma única agenda e fluxo financeiro com Stripe.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body
        className={`${inter.variable} ${robotoMono.variable} antialiased`}
      >
        <div className="min-h-screen">{children}</div>
      </body>
    </html>
  );
}
