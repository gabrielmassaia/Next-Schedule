import { count } from "drizzle-orm";
import { cache } from "react";

import { db } from "@/db";
import {
  subscriptionPlanFeaturesTable,
  subscriptionPlansTable,
} from "@/db/schema";

export type SubscriptionPlanSlug = "essential" | "pro" | "enterprise";

export interface SubscriptionPlanLimits {
  clinics: number | null;
  professionalsPerClinic: number | null;
  patientsPerClinic: number | null;
}

export interface SubscriptionPlan {
  slug: SubscriptionPlanSlug;
  name: string;
  description: string;
  priceInCents: number | null;
  stripePriceId?: string;
  priority: number;
  limits: SubscriptionPlanLimits;
  features: string[];
  comingSoon?: boolean;
}

interface SubscriptionPlanSeed {
  slug: SubscriptionPlanSlug;
  name: string;
  description: string;
  priceInCents: number | null;
  stripePriceEnvKey?: string;
  priority: number;
  limits: SubscriptionPlanLimits;
  features: string[];
  comingSoon?: boolean;
}

const SUBSCRIPTION_PLAN_SEEDS: SubscriptionPlanSeed[] = [
  {
    slug: "essential",
    name: "Essential",
    description: "Ideal para profissionais autônomos que precisam começar rapidamente.",
    priceInCents: 9900,
    stripePriceEnvKey: "STRIPE_ESSENTIAL_PLAN_PRICE_ID",
    priority: 0,
    limits: {
      clinics: 1,
      professionalsPerClinic: 3,
      patientsPerClinic: null,
    },
    features: [
      "Cadastro de até 3 profissionais",
      "Agendamentos ilimitados",
      "Métricas básicas",
      "Cadastro de pacientes",
      "Confirmação manual",
      "Suporte via e-mail",
      "Limite de 1 clínica",
    ],
  },
  {
    slug: "pro",
    name: "Pro",
    description: "Pensado para clínicas em crescimento que demandam mais controle.",
    priceInCents: 19900,
    stripePriceEnvKey: "STRIPE_PRO_PLAN_PRICE_ID",
    priority: 1,
    limits: {
      clinics: 3,
      professionalsPerClinic: 15,
      patientsPerClinic: null,
    },
    features: [
      "Cadastro de até 15 profissionais",
      "Agendamentos ilimitados",
      "Métricas avançadas",
      "Cadastro de pacientes",
      "Confirmação manual",
      "Suporte via e-mail",
      "Limite de 3 clínicas",
    ],
  },
  {
    slug: "enterprise",
    name: "Enterprise",
    description: "Para redes de clínicas que precisam de flexibilidade total.",
    priceInCents: 39900,
    stripePriceEnvKey: "STRIPE_ENTERPRISE_PLAN_PRICE_ID",
    priority: 2,
    limits: {
      clinics: null,
      professionalsPerClinic: null,
      patientsPerClinic: null,
    },
    features: [
      "Cadastro de profissionais ilimitados",
      "Agendamentos ilimitados",
      "Métricas avançadas",
      "Cadastro de pacientes",
      "Confirmação manual ou assistida por agente",
      "Suporte por canal privado e dedicado",
      "Clínicas ilimitadas",
    ],
  },
];

const seedSubscriptionPlans = async () => {
  const [{ value: totalPlans }] = await db
    .select({ value: count() })
    .from(subscriptionPlansTable);

  if ((totalPlans ?? 0) > 0) {
    return;
  }

  for (const plan of SUBSCRIPTION_PLAN_SEEDS) {
    await db.insert(subscriptionPlansTable).values({
      slug: plan.slug,
      name: plan.name,
      description: plan.description,
      priceInCents: plan.priceInCents,
      stripePriceId: plan.stripePriceEnvKey
        ? process.env[plan.stripePriceEnvKey] ?? null
        : null,
      priority: plan.priority,
      clinicsLimit: plan.limits.clinics,
      professionalsPerClinicLimit: plan.limits.professionalsPerClinic,
      patientsPerClinicLimit: plan.limits.patientsPerClinic,
      comingSoon: plan.comingSoon ?? false,
    });

    if (plan.features.length) {
      await db.insert(subscriptionPlanFeaturesTable).values(
        plan.features.map((feature, index) => ({
          planSlug: plan.slug,
          description: feature,
          sortOrder: index,
        })),
      );
    }
  }
};

const mapPlan = (
  plan: typeof subscriptionPlansTable.$inferSelect & {
    features: (typeof subscriptionPlanFeaturesTable.$inferSelect)[];
  },
): SubscriptionPlan => ({
  slug: plan.slug as SubscriptionPlanSlug,
  name: plan.name,
  description: plan.description,
  priceInCents: plan.priceInCents,
  stripePriceId: plan.stripePriceId ?? undefined,
  priority: plan.priority,
  limits: {
    clinics: plan.clinicsLimit,
    professionalsPerClinic: plan.professionalsPerClinicLimit,
    patientsPerClinic: plan.patientsPerClinicLimit,
  },
  features: plan.features
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((feature) => feature.description),
  comingSoon: plan.comingSoon ?? false,
});

export const DEFAULT_PLAN_SLUG: SubscriptionPlanSlug = "essential";

export const getSubscriptionPlans = cache(async (): Promise<SubscriptionPlan[]> => {
  await seedSubscriptionPlans();

  const plans = await db.query.subscriptionPlansTable.findMany({
    with: {
      features: {
        orderBy: (feature, { asc }) => [asc(feature.sortOrder)],
      },
    },
    orderBy: (plan, { asc }) => [asc(plan.priority)],
  });

  return plans.map(mapPlan);
});

export const getPlanBySlug = cache(
  async (slug: string | null | undefined): Promise<SubscriptionPlan> => {
    const normalizedSlug = (slug ?? DEFAULT_PLAN_SLUG) as SubscriptionPlanSlug;
    const plans = await getSubscriptionPlans();
    const plan = plans.find((item) => item.slug === normalizedSlug);
    if (plan) {
      return plan;
    }
    return plans[0];
  },
);

export async function planMeetsRequirement(
  currentPlan: SubscriptionPlan,
  requiredPlanSlug: SubscriptionPlanSlug,
) {
  const requiredPlan = await getPlanBySlug(requiredPlanSlug);
  return currentPlan.priority >= requiredPlan.priority;
}
