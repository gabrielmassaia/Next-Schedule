"use server";

import { headers } from "next/headers";
import Stripe from "stripe";
import { z } from "zod";

import { getPlanBySlug } from "@/data/subscription-plans";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

export const createStripeCheckout = actionClient
  .schema(z.object({ planSlug: z.string() }))
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) {
      throw new Error("Unauthorized");
    }
    const plan = await getPlanBySlug(parsedInput.planSlug);
    if (!plan.stripePriceId) {
      throw new Error("Plano indisponível para checkout");
    }
    if (plan.comingSoon) {
      throw new Error("Este plano ainda não está disponível para contratação");
    }
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("Stripe secret key not found");
    }
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-05-28.basil",
    });
    const { id: sessionId } = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      subscription_data: {
        metadata: {
          userId: session.user.id,
          planSlug: plan.slug,
        },
      },
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1,
          metadata: {
            userId: session.user.id,
            planSlug: plan.slug,
          },
        },
      ],
    });
    return {
      sessionId,
    };
  });
