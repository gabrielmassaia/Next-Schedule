import { asc } from "drizzle-orm";
import { cache } from "react";

import { db } from "@/db";
import { plansTable } from "@/db/schema";

export type SubscriptionPlanSlug = "essential" | "pro" | "enterprise";

export interface SubscriptionPlanLimits {
  clinics: number | null;
  professionalsPerClinic: number | null;
  patientsPerClinic: number | null;
  dashboard: boolean;
  aiAgent: boolean;
  automatedScheduling: boolean;
  apiKey: boolean;
}

export interface SubscriptionPlan {
  slug: SubscriptionPlanSlug;
  name: string;
  description: string;
  priceInCents: number | null;
  priority: number;
  limits: SubscriptionPlanLimits;
  features: string[];
  stripePriceId?: string;
  comingSoon?: boolean;
}

const mapPlanRecord = (
  plan: typeof plansTable.$inferSelect,
): SubscriptionPlan => {
  const envPriceId = plan.stripePriceEnvKey
    ? process.env[plan.stripePriceEnvKey]
    : undefined;

  return {
    slug: plan.slug as SubscriptionPlanSlug,
    name: plan.name,
    description: plan.description,
    priceInCents: plan.priceInCents,
    priority: plan.priority,
    limits: plan.limits,
    features: plan.features,
    stripePriceId: plan.stripePriceId ?? envPriceId ?? undefined,
    comingSoon: plan.comingSoon ?? false,
  };
};

export const getSubscriptionPlans = cache(async () => {
  const plans = await db.query.plansTable.findMany({
    orderBy: asc(plansTable.priority),
  });

  return plans.map(mapPlanRecord);
});

export const DEFAULT_PLAN_SLUG: SubscriptionPlanSlug = "essential";

export const getPlanBySlug = cache(async (slug: string | null | undefined) => {
  const plans = await getSubscriptionPlans();
  const normalizedSlug = (slug ?? DEFAULT_PLAN_SLUG) as SubscriptionPlanSlug;
  const plan = plans.find((item) => item.slug === normalizedSlug);
  if (plan) {
    return plan;
  }

  if (plans.length === 0) {
    // Fallback object if DB is empty to prevent crashes, but with restrictive limits
    return {
      slug: "essential",
      name: "Essential (Fallback)",
      description: "Fallback plan when database is empty",
      priceInCents: 0,
      priority: 0,
      limits: {
        clinics: 1,
        professionalsPerClinic: 1,
        patientsPerClinic: 150,
        dashboard: false,
        aiAgent: false,
        automatedScheduling: false,
        apiKey: false,
      },
      features: [],
      comingSoon: false,
    } satisfies SubscriptionPlan;
  }

  return plans[0];
});

export async function planMeetsRequirement(
  currentPlan: SubscriptionPlan,
  requiredPlanSlug: SubscriptionPlanSlug,
) {
  const requiredPlan = await getPlanBySlug(requiredPlanSlug);
  return currentPlan.priority >= requiredPlan.priority;
}
