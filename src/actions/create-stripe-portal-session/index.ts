"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import Stripe from "stripe";

import { db } from "@/db";
import { usersTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

export const createStripePortalSession = actionClient.action(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    throw new Error("Usuário não autenticado");
  }

  const userDb = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, session.user.id),
  });
  if (!userDb?.stripeCustomerId) {
    throw new Error("Usuário sem stripeCustomerId");
  }

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

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: userDb.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  });

  return { url: portalSession.url };
});
