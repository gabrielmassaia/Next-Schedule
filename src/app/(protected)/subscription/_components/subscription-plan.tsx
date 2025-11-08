"use client";

import { loadStripe } from "@stripe/stripe-js";
import { ArrowUpRight, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { createStripeCheckout } from "@/actions/create-stripe-checkout";
import { createStripePortalSession } from "@/actions/create-stripe-portal-session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { SubscriptionPlan as SubscriptionPlanType } from "@/data/subscription-plans";
import { cn } from "@/lib/utils";

interface SubscriptionPlanProps {
  plan: SubscriptionPlanType;
  isActive: boolean;
  className?: string;
  inactiveCtaLabel?: string;
  activeCtaLabel?: string;
}

export function SubscriptionPlan({
  plan,
  isActive,
  className,
  inactiveCtaLabel,
  activeCtaLabel,
}: SubscriptionPlanProps) {
  const highlightBySlug: Record<
    SubscriptionPlanType["slug"],
    {
      badge?: string;
      tagline: string;
      accent: string;
      border: string;
      cta: string;
    }
  > = {
    essential: {
      badge: "Comece grátis",
      tagline:
        "Configure sua clínica em minutos e centralize todos os atendimentos sem custo inicial.",
      accent: "from-sky-500/10 to-sky-500/5",
      border: "border-sky-100",
      cta: "Começar sem compromisso",
    },
    pro: {
      badge: "Mais popular",
      tagline:
        "Automatize confirmações com IA, reduza faltas e aumente a receita com insights em tempo real.",
      accent: "from-purple-500/10 to-purple-500/5",
      border: "border-purple-200",
      cta: "Quero acelerar minha clínica",
    },
    enterprise: {
      badge: "Para redes visionárias",
      tagline:
        "Controle múltiplas unidades com governança avançada e suporte dedicado de especialistas.",
      accent: "from-amber-500/10 to-amber-500/5",
      border: "border-amber-200",
      cta: "Conversar com especialista",
    },
  };

  const planHighlight = highlightBySlug[plan.slug];

  const createStripeCheckoutAction = useAction(createStripeCheckout, {
    onSuccess: async ({ data }) => {
      if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
        throw new Error("Stripe publishable key not found");
      }
      const stripe = await loadStripe(
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      );
      if (!stripe) {
        throw new Error("Stripe not found");
      }
      if (!data?.sessionId) {
        throw new Error("Session ID not found");
      }
      await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });
    },
  });
  const createPortalSession = useAction(createStripePortalSession, {
    onSuccess: ({ data }) => {
      if (data?.url) {
        window.location.href = data.url;
      }
    },
  });
  const handleSubscribeClick = () => {
    if (!plan.stripePriceId) {
      toast.error("Plano indisponível para assinatura no momento");
      return;
    }
    createStripeCheckoutAction.execute({ planSlug: plan.slug });
  };

  const handleManagePlanClick = () => {
    createPortalSession.execute();
  };

  const priceLabel =
    typeof plan?.priceInCents === "number"
      ? new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(plan.priceInCents / 100)
      : "Gratuito";

  const isCheckoutDisabled =
    createStripeCheckoutAction.isExecuting ||
    plan?.comingSoon ||
    (isActive && plan.slug === "essential") ||
    (!plan?.stripePriceId && !isActive);

  const showPortalButton = isActive && plan.slug !== "essential";

  const defaultActiveLabel = showPortalButton
    ? "Gerenciar assinatura"
    : "Plano atual";
  const activePlanLabel = activeCtaLabel ?? defaultActiveLabel;
  const inactivePlanLabel = inactiveCtaLabel ?? planHighlight.cta;

  return (
    <Card
      className={cn(
        "relative flex h-full flex-col overflow-hidden border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
        planHighlight.border,
        isActive ? "border-primary shadow-lg" : "border-gray-200",
        className,
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-br",
          planHighlight.accent,
        )}
        aria-hidden
      />
      <CardHeader className="relative space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-bold text-gray-900">{plan?.name}</h3>
              {planHighlight.badge ? (
                <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                  {planHighlight.badge}
                </Badge>
              ) : null}
            </div>
            <p className="mt-2 text-sm font-medium text-gray-600">
              {planHighlight.tagline}
            </p>
          </div>
          {isActive ? (
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
              Plano atual
            </Badge>
          ) : null}
        </div>
        <div className="space-y-2 text-gray-600">
          <p>{plan?.description}</p>
          <div className="flex items-baseline gap-2 text-gray-900">
            <span className="text-3xl font-bold">{priceLabel}</span>
            {typeof plan?.priceInCents === "number" ? (
              <span className="text-base font-medium text-gray-600">/ mês</span>
            ) : (
              <span className="text-base font-medium text-gray-600">
                Integrado ao sucesso da sua clínica
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative flex flex-1 flex-col justify-between">
        <div className="space-y-4 rounded-xl border border-gray-100 bg-white/70 p-5 shadow-sm backdrop-blur">
          {plan?.features.map((feature, index) => (
            <div key={index} className="flex items-start gap-3">
              <span className="bg-primary/10 text-primary rounded-full p-1">
                <CheckCircle2 className="h-5 w-5" />
              </span>
              <p className="text-sm text-gray-700">{feature}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 space-y-3">
          <Button
            className="group w-full"
            variant={isActive ? "secondary" : "default"}
            onClick={isActive ? handleManagePlanClick : handleSubscribeClick}
            disabled={isCheckoutDisabled}
          >
            {createStripeCheckoutAction.isExecuting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : plan?.comingSoon ? (
              "Em breve"
            ) : isActive ? (
              activePlanLabel
            ) : (
              inactivePlanLabel
            )}
            {!plan?.comingSoon && !isCheckoutDisabled ? (
              <ArrowUpRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            ) : null}
          </Button>

          {!plan?.comingSoon ? (
            <p className="flex items-center justify-center gap-2 text-center text-xs text-gray-500">
              <Sparkles className="h-4 w-4 text-amber-500" />
              {plan.slug === "essential"
                ? "Acelere os agendamentos com inteligência artificial desde o primeiro dia."
                : "Automatize confirmações com nosso agente de IA e reduza no-shows em até 42%."}
            </p>
          ) : (
            <p className="text-center text-xs text-gray-500">
              Estamos finalizando recursos exclusivos com nossos especialistas
              para sua rede.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
