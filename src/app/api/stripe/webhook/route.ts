import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { DEFAULT_PLAN_SLUG, getPlanBySlug } from "@/data/subscription-plans";
import { db } from "@/db";
import { usersTable } from "@/db/schema";

export const POST = async (request: Request) => {
  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    console.error("Missing stripe-signature header");
    return new NextResponse("Missing signature", { status: 400 });
  }

  const body = await request.text();

  // Escolher webhook secret baseado no que bateu
  const webhookSecretTest = process.env.STRIPE_WEBHOOK_SECRET_TEST!;
  const webhookSecretProd = process.env.STRIPE_WEBHOOK_SECRET_PROD!;

  let event: Stripe.Event;

  let mode: "test" | "prod" | null = null;
  let stripe!: Stripe;

  try {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY_TEST!, {
      apiVersion: "2025-08-27.basil",
    });

    event = stripe.webhooks.constructEvent(body, sig, webhookSecretTest);
    mode = "test";
  } catch (errTest) {
    try {
      stripe = new Stripe(process.env.STRIPE_SECRET_KEY_PROD!, {
        apiVersion: "2025-08-27.basil",
      });

      event = stripe.webhooks.constructEvent(body, sig, webhookSecretProd);
      mode = "prod";
    } catch (errProd) {
      console.error("Webhook signature invalid for both keys");
      return new NextResponse("Invalid signature", { status: 400 });
    }
  }

  console.log(
    "🔔 Stripe webhook recebido — Ambiente:",
    mode,
    "Tipo:",
    event.type,
  );

  switch (event.type) {
    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;

      let subscriptionId: string | undefined;
      const parentSub = invoice.parent?.subscription_details?.subscription;
      const lineSub =
        invoice.lines?.data?.[0]?.parent?.subscription_item_details
          ?.subscription;

      if (typeof parentSub === "string") subscriptionId = parentSub;
      if (typeof lineSub === "string") subscriptionId = lineSub;

      if (!subscriptionId) {
        throw new Error("Subscription not found");
      }

      let userId: string | undefined;
      if (invoice.parent?.subscription_details?.metadata?.userId) {
        userId = invoice.parent.subscription_details.metadata.userId;
      } else if (invoice.lines?.data?.[0]?.metadata?.userId) {
        userId = invoice.lines.data[0].metadata.userId;
      }

      if (!userId) {
        throw new Error("User ID not found in invoice metadata");
      }

      const planSlugFromInvoice =
        invoice.parent?.subscription_details?.metadata?.planSlug ??
        invoice.lines?.data?.[0]?.metadata?.planSlug;

      const plan = await getPlanBySlug(planSlugFromInvoice);

      await db
        .update(usersTable)
        .set({
          stripeSubscriptionId: subscriptionId,
          stripeCustomerId:
            typeof invoice.customer === "string"
              ? invoice.customer
              : (invoice.customer?.id ?? null),
          plan: plan.slug,
        })
        .where(eq(usersTable.id, userId));

      break;
    }

    case "customer.subscription.deleted": {
      const subscriptionId = event.data.object.id;
      if (!subscriptionId) throw new Error("Subscription ID not found");

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      if (!subscription) throw new Error("Subscription not found");

      const userId = subscription.metadata.userId;
      if (!userId) throw new Error("User ID not found");

      await db
        .update(usersTable)
        .set({
          stripeSubscriptionId: null,
          stripeCustomerId: null,
          plan: DEFAULT_PLAN_SLUG,
        })
        .where(eq(usersTable.id, userId));

      break;
    }
  }

  return NextResponse.json({ received: true });
};
