"use client";

import { loadStripe } from "@stripe/stripe-js";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { createStripeCheckout } from "@/actions/create-stripe-checkout";
import { createStripePortalSession } from "@/actions/create-stripe-portal-session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { SubscriptionPlan as SubscriptionPlanType } from "@/data/subscription-plans";

interface SubscriptionPlanProps {
  plan: SubscriptionPlanType;
  isActive: boolean;
  className?: string;
}

export function SubscriptionPlan({
  plan,
  isActive,
  className,
}: SubscriptionPlanProps) {
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
    typeof plan.priceInCents === "number"
      ? new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(plan.priceInCents / 100)
      : "Gratuito";

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
          {isActive && (
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
              Atual
            </Badge>
          )}
        </div>
        <p className="text-gray-600">{plan.description}</p>
        <div className="flex items-baseline">
          <span className="text-3xl font-bold text-gray-900">{priceLabel}</span>
          {typeof plan.priceInCents === "number" && (
            <span className="ml-1 text-gray-600">/ mês</span>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4 border-t border-gray-200 pt-6">
          {plan.features.map((feature, index) => (
            <div key={index} className="flex items-start">
              <div className="flex-shrink-0">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <p className="ml-3 text-gray-600">{feature}</p>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <Button
            className="w-full"
            variant="outline"
            onClick={
              isActive ? handleManagePlanClick : handleSubscribeClick
            }
            disabled={
              createStripeCheckoutAction.isExecuting ||
              plan.comingSoon ||
              (isActive && plan.slug === "free") ||
              (!plan.stripePriceId && !isActive)
            }
          >
            {createStripeCheckoutAction.isExecuting ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : plan.comingSoon ? (
              "Em breve"
            ) : isActive ? (
              "Gerenciar assinatura"
            ) : (
              "Fazer assinatura"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
