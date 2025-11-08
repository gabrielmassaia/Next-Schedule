export type SubscriptionPlanSlug = "essential" | "pro" | "enterprise";

export interface SubscriptionPlanLimits {
  clinics: number | null;
  doctorsPerClinic: number | null;
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

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    slug: "essential",
    name: "essential",
    description:
      "Ideal para experimentar o Next Schedule com uma única clinica.",
    priceInCents: 0,
    priority: 0,
    limits: {
      clinics: 1,
      doctorsPerClinic: 1,
      patientsPerClinic: 150,
    },
    features: [
      "1 clínica",
      "1 médico",
      "Pacientes limitados a 150",
      "Agendamentos básicos",
    ],
  },
  {
    slug: "pro",
    name: "pro",
    description:
      "Para profissionais autônomos ou pequenas clínicas que precisam de mais flexibilidade.",
    priceInCents: 9900,
    stripePriceId: process.env.STRIPE_ESSENTIAL_PLAN_PRICE_ID,
    priority: 1,
    limits: {
      clinics: 3,
      doctorsPerClinic: 5,
      patientsPerClinic: 1000,
    },
    features: [
      "Até 3 clínicas",
      "Até 5 médicos por clínica",
      "Pacientes ilimitados",
      "Agendamentos ilimitados",
      "Métricas básicas",
      "Suporte via e-mail",
    ],
  },
  {
    slug: "enterprise",
    name: "enterprise",
    description:
      "Para redes de clínicas que precisam de recursos avançados e limites maiores.",
    priceInCents: 24900,
    priority: 2,
    limits: {
      clinics: null,
      doctorsPerClinic: null,
      patientsPerClinic: null,
    },
    features: [
      "Clínicas ilimitadas",
      "Médicos ilimitados",
      "Pacientes ilimitados",
      "Suporte prioritário",
      "Recursos avançados (em breve)",
    ],
    comingSoon: true,
  },
];

export const DEFAULT_PLAN_SLUG: SubscriptionPlanSlug = "essential";

export function getPlanBySlug(
  slug: string | null | undefined,
): SubscriptionPlan {
  const normalizedSlug = (slug ?? DEFAULT_PLAN_SLUG) as SubscriptionPlanSlug;
  const plan = SUBSCRIPTION_PLANS.find((item) => item.slug === normalizedSlug);
  if (plan) {
    return plan;
  }
  return SUBSCRIPTION_PLANS[0];
}

export function planMeetsRequirement(
  currentPlan: SubscriptionPlan,
  requiredPlanSlug: SubscriptionPlanSlug,
) {
  const requiredPlan = SUBSCRIPTION_PLANS.find(
    (plan) => plan.slug === requiredPlanSlug,
  );
  if (!requiredPlan) {
    return true;
  }
  return currentPlan.priority >= requiredPlan.priority;
}
