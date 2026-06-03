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
  title: "StatPitch — Bolão Copa do Mundo 2026",
  description:
    "Monte sua liga, faça seus palpites e dispute com amigos no maior evento do futebol mundial. Sistema de Custódia Zero — organização e estatísticas, sem complicação.",
  keywords: [
    "bolão",
    "copa do mundo 2026",
    "palpites",
    "futebol",
    "liga",
    "ranking",
  ],
  openGraph: {
    title: "StatPitch — Bolão Copa do Mundo 2026",
    description:
      "Monte sua liga, faça seus palpites e dispute com amigos.",
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
        <div className="bg-gradient-radial min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
