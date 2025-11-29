import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  getSubscriptionPlans,
  type SubscriptionPlan,
} from "@/data/subscription-plans";
import { cn } from "@/lib/utils";

export async function Pricing() {
  const plans = await getSubscriptionPlans();

  return (
    <section
      id="pricing"
      className="relative z-10 overflow-hidden bg-black py-24"
    >
      {/* Background gradients */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-full w-full max-w-7xl -translate-x-1/2 -translate-y-1/2">
        <div className="bg-primary/10 absolute top-1/4 right-1/4 h-96 w-96 rounded-full opacity-20 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 h-96 w-96 rounded-full bg-purple-500/10 opacity-20 blur-3xl" />
      </div>

      <div className="relative container mx-auto px-4 md:px-6">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Planos transparentes
          </h2>
          <p className="mt-4 text-lg text-zinc-400">
            Escolha o plano ideal para o momento da sua clínica.
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-3">
          {plans.map((plan) => (
            <PricingCard key={plan.slug} plan={plan} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingCard({ plan }: { plan: SubscriptionPlan }) {
  const highlightBySlug: Record<
    string,
    {
      badge?: string;
      tagline: string;
      accent: string;
      border: string;
      cta: string;
    }
  > = {
    essential: {
      badge: "Para clínicas pequenas",
      tagline: "Ideal para consultórios individuais e profissionais liberais.",
      accent: "from-sky-500/10 to-sky-500/5",
      border: "border-sky-900/20",
      cta: "Escolher Essential",
    },
    pro: {
      badge: "para redes emergentes",
      tagline: "Para clínicas que buscam crescimento e eficiência.",
      accent: "from-purple-500/20 to-purple-500/10",
      border: "border-purple-500/50",
      cta: "Escolher Pro",
    },
    enterprise: {
      badge: "Mais escolhido",
      tagline: "Soluções personalizadas para grandes operações.",
      accent: "from-amber-500/10 to-amber-500/5",
      border: "border-amber-900/20",
      cta: "Escolher Enterprise",
    },
  };

  const planHighlight = highlightBySlug[plan.slug] ?? highlightBySlug.essential;

  const priceLabel =
    typeof plan.priceInCents === "number"
      ? new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(plan.priceInCents / 100)
      : "Gratuito";

  return (
    <Card
      className={cn(
        "relative flex h-full flex-col overflow-hidden border bg-black/40 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl",
        planHighlight.border,
        plan.slug === "pro"
          ? "z-10 scale-105 shadow-purple-500/10"
          : "opacity-80 hover:opacity-100",
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-28 bg-linear-to-br",
          planHighlight.accent,
        )}
        aria-hidden
      />
      <CardHeader className="relative space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
              {planHighlight.badge ? (
                <Badge className="border-0 bg-white/10 text-white backdrop-blur-md hover:bg-white/20">
                  {planHighlight.badge}
                </Badge>
              ) : null}
            </div>
            <p className="mt-2 min-h-[40px] text-sm font-medium text-zinc-400">
              {planHighlight.tagline}
            </p>
          </div>
        </div>
        <div className="space-y-2 text-zinc-400">
          <div className="flex items-baseline gap-2 text-white">
            <span className="text-4xl font-bold tracking-tight">
              {priceLabel}
            </span>
            {typeof plan.priceInCents === "number" ? (
              <span className="text-base font-medium text-zinc-500">/ mês</span>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative flex flex-1 flex-col justify-between">
        <div className="mb-8 space-y-4">
          {plan.features.map((feature, index) => (
            <div key={index} className="flex items-start gap-3">
              <span className="mt-0.5 rounded-full bg-white/10 p-1 text-white">
                <CheckCircle2 className="h-3 w-3" />
              </span>
              <p className="text-sm text-zinc-300">{feature}</p>
            </div>
          ))}
        </div>

        <div className="mt-auto space-y-3">
          <Button
            asChild
            className={cn(
              "group h-12 w-full rounded-full text-base font-semibold transition-all duration-300",
              plan.slug === "pro"
                ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:bg-zinc-200"
                : "bg-white/10 text-white hover:bg-white/20",
            )}
            variant={plan.slug === "pro" ? "default" : "secondary"}
          >
            <Link href="/authentication?tab=register">
              {plan.comingSoon ? "Em breve" : planHighlight.cta}
              {!plan.comingSoon && (
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              )}
            </Link>
          </Button>

          {!plan.comingSoon ? (
            <p className="flex items-center justify-center gap-2 text-center text-xs text-zinc-500">
              <Sparkles className="h-3 w-3 text-amber-500" />
              Garantia de 7 dias
            </p>
          ) : (
            <p className="text-center text-xs text-zinc-500">
              Disponível em breve
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
