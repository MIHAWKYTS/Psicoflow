import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "PsiGen — Gestão Inteligente para Psicólogos",
  description:
    "SaaS completo para gestão de clínicas de psicologia: agenda, prontuários eletrônicos, controle financeiro e integração WhatsApp.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${jakartaSans.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
