import { redirect } from "next/navigation";
import { featureFlags } from "@/lib/feature-flags";
import EstoqueClient from "./_EstoqueClient";

export default function EstoquePage() {
  if (!featureFlags.estoque) {
    redirect("/dashboard");
  }

  return <EstoqueClient />;
}
