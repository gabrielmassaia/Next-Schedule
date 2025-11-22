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

    if (!session?.user?.id) throw new Error("Unauthorized");

    const plan = await getPlanBySlug(parsedInput.planSlug);
    if (!plan.stripePriceId) throw new Error("Plano sem priceId configurado");

    // Detectar ambiente Stripe
    const isProduction = process.env.VERCEL_ENV === "production";

    const stripeSecret = isProduction
      ? process.env.STRIPE_SECRET_KEY_PROD
      : process.env.STRIPE_SECRET_KEY_TEST;

    if (!stripeSecret) {
      throw new Error(
        `Stripe secret key (${isProduction ? "PROD" : "TEST"}) não encontrada`,
      );
    }

    const stripe = new Stripe(stripeSecret, {
      apiVersion: "2025-08-27.basil",
    });

    const checkoutContext = {
      userId: session.user.id,
      planSlug: plan.slug,
    } as const;

    console.info("[createStripeCheckout] Creating session", checkoutContext);

    const { id: sessionId } = await stripe.checkout.sessions
      .create({
        payment_method_types: ["card"],
        mode: "subscription",
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/authentication`,
        client_reference_id: session.user.id,
        subscription_data: {
          metadata: checkoutContext,
        },
        line_items: [
          {
            price: plan.stripePriceId,
            quantity: 1,
          },
        ],
      })
      .catch((error) => {
        console.error("[createStripeCheckout] Session creation failed", {
          ...checkoutContext,
          error,
        });
        throw error;
      });

    return { sessionId };
  });
