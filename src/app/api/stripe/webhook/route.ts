import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { DEFAULT_PLAN_SLUG, getPlanBySlug } from "@/data/subscription-plans";
import { db } from "@/db";
import { usersTable } from "@/db/schema";

export const POST = async (request: Request) => {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error("Stripe secret key not found");
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    throw new Error("Stripe signature not found");
  }
  const text = await request.text();
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-08-27.basil",
  });
  const event = stripe.webhooks.constructEvent(
    text,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET,
  );

  switch (event.type) {
    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;

      // Buscar subscriptionId
      let subscriptionId: string | undefined;
      const parentSub = invoice.parent?.subscription_details?.subscription;
      const lineSub =
        invoice.lines?.data?.[0]?.parent?.subscription_item_details
          ?.subscription;
      if (typeof parentSub === "string") {
        subscriptionId = parentSub;
      } else if (typeof lineSub === "string") {
        subscriptionId = lineSub;
      }

      if (!subscriptionId) {
        throw new Error("Subscription not found");
      }

      // Buscar userId
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
        (invoice.parent?.subscription_details?.metadata?.planSlug as
          | string
          | undefined) ??
        (invoice.lines?.data?.[0]?.metadata?.planSlug as string | undefined);

      const plan = await getPlanBySlug(planSlugFromInvoice ?? undefined);

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
      if (!event.data.object.id) {
        throw new Error("Subscription ID not found");
      }
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2025-08-27.basil",
      });
      const subscription = await stripe.subscriptions.retrieve(
        event.data.object.id,
      );
      if (!subscription) {
        throw new Error("Subscription not found");
      }
      const userId = subscription.metadata.userId;
      if (!userId) {
        throw new Error("User ID not found");
      }
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
  return NextResponse.json({
    received: true,
  });
};
