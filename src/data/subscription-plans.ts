import { asc } from "drizzle-orm";
import { cache } from "react";

import { db } from "@/db";
import { plansTable } from "@/db/schema";

type PlanSeed = {
  slug: SubscriptionPlanSlug;
  name: string;
  description: string;
  priceInCents: number | null;
  priority: number;
  limits: SubscriptionPlanLimits;
  features: string[];
  stripePriceEnvKey?: string;
  comingSoon?: boolean;
};

const DEFAULT_PLAN_SEEDS: PlanSeed[] = [
  {
    slug: "essential",
    name: "Essential",
    description:
      "Ideal para experimentar o Next Schedule com uma única clínica e equipe enxuta.",
    priceInCents: 0,
    priority: 0,
    limits: {
      clinics: 1,
      professionalsPerClinic: 1,
      clientsPerClinic: 150,
    },
    features: [
      "1 clínica",
      "1 profissional",
      "Até 150 clientes",
      "Agendamentos básicos",
    ],
    stripePriceEnvKey: "STRIPE_ESSENTIAL_PLAN_PRICE_ID",
  },
  {
    slug: "pro",
    name: "Pro",
    description:
      "Para clínicas em crescimento que precisam de mais profissionais e clientes.",
    priceInCents: 9900,
    priority: 1,
    limits: {
      clinics: 3,
      professionalsPerClinic: 5,
      clientsPerClinic: 1000,
    },
    features: [
      "Até 3 clínicas",
      "Até 5 profissionais por clínica",
      "Clientes ilimitados",
      "Agendamentos ilimitados",
      "Métricas essenciais",
      "Suporte via e-mail",
    ],
    stripePriceEnvKey: "STRIPE_PRO_PLAN_PRICE_ID",
  },
  {
    slug: "enterprise",
    name: "Enterprise",
    description:
      "Para redes de clínicas que precisam de recursos avançados e limites maiores.",
    priceInCents: 24900,
    priority: 2,
    limits: {
      clinics: null,
      professionalsPerClinic: null,
      clientsPerClinic: null,
    },
    features: [
      "Clínicas ilimitadas",
      "Profissionais ilimitados",
      "Clientes ilimitados",
      "Suporte prioritário",
      "Recursos avançados (em breve)",
    ],
    stripePriceEnvKey: "STRIPE_ENTERPRISE_PLAN_PRICE_ID",
    comingSoon: true,
  },
];

export type SubscriptionPlanSlug = "essential" | "pro" | "enterprise";

export interface SubscriptionPlanLimits {
  clinics: number | null;
  professionalsPerClinic: number | null;
  clientsPerClinic: number | null;
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

const ensurePlansSeeded = cache(async () => {
  const values = DEFAULT_PLAN_SEEDS.map((plan) => ({
    slug: plan.slug,
    name: plan.name,
    description: plan.description,
    priceInCents: plan.priceInCents,
    priority: plan.priority,
    limits: plan.limits,
    features: plan.features,
    stripePriceEnvKey: plan.stripePriceEnvKey,
    stripePriceId: plan.stripePriceEnvKey
      ? process.env[plan.stripePriceEnvKey] ?? null
      : null,
    comingSoon: plan.comingSoon ?? false,
  }));

  await db
    .insert(plansTable)
    .values(values)
    .onConflictDoNothing({ target: plansTable.slug });
});

const mapPlanRecord = (plan: typeof plansTable.$inferSelect): SubscriptionPlan => {
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
  await ensurePlansSeeded();

  const plans = await db.query.plansTable.findMany({
    orderBy: asc(plansTable.priority),
  });

  if (plans.length === 0) {
    return DEFAULT_PLAN_SEEDS.map((plan) => ({
      slug: plan.slug,
      name: plan.name,
      description: plan.description,
      priceInCents: plan.priceInCents,
      priority: plan.priority,
      limits: plan.limits,
      features: plan.features,
      stripePriceId: plan.stripePriceEnvKey
        ? process.env[plan.stripePriceEnvKey] ?? undefined
        : undefined,
      comingSoon: plan.comingSoon,
    } satisfies SubscriptionPlan));
  }

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
  return plans[0];
});

export async function planMeetsRequirement(
  currentPlan: SubscriptionPlan,
  requiredPlanSlug: SubscriptionPlanSlug,
) {
  const requiredPlan = await getPlanBySlug(requiredPlanSlug);
  return currentPlan.priority >= requiredPlan.priority;
}
