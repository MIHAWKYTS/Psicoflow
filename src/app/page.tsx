import { redirect } from "next/navigation";
import { getRequestContext } from "@/lib/context";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingHero from "@/components/landing/LandingHero";
import LandingFeatures from "@/components/landing/LandingFeatures";
import LandingJornada from "@/components/landing/LandingJornada";
import LandingPricing from "@/components/landing/LandingPricing";
import LandingFAQ from "@/components/landing/LandingFAQ";
import LandingFooter from "@/components/landing/LandingFooter";

export const metadata = {
  title: "PsiGen — Gestão completa para clínicas de psicologia",
  description:
    "Agenda, prontuários, financeiro, WhatsApp integrado e gestão de equipe em um único sistema. Comece grátis por 15 dias, sem cartão de crédito.",
  openGraph: {
    title: "PsiGen — Gestão completa para clínicas de psicologia",
    description:
      "Agenda, prontuários, financeiro, WhatsApp integrado e gestão de equipe em um único sistema. 15 dias grátis.",
    type: "website",
  },
};

export default async function Home() {
  const ctx = await getRequestContext();
  if (ctx) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-white dark:bg-slate-950">
      <LandingNavbar />
      <LandingHero />
      <LandingFeatures />
      <LandingJornada />
      <LandingPricing />
      <LandingFAQ />
      <LandingFooter />
    </main>
  );
}
