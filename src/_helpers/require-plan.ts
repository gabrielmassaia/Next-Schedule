import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  DEFAULT_PLAN_SLUG,
  getPlanBySlug,
  planMeetsRequirement,
  type SubscriptionPlanSlug,
} from "@/data/subscription-plans";
import { auth } from "@/lib/auth";
import {
  type ClinicSummary,
  readActiveClinicIdFromCookies,
  selectActiveClinic,
} from "@/lib/clinic-session";

interface RequirePlanResult {
  session: NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;
  plan: Awaited<ReturnType<typeof getPlanBySlug>>;
  clinics: ClinicSummary[];
  activeClinic: ClinicSummary | null;
  activeClinicId: string | null;
}

export async function requirePlan(
  requiredPlan: SubscriptionPlanSlug = DEFAULT_PLAN_SLUG,
): Promise<RequirePlanResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/authentication");
  }

  const plan = await getPlanBySlug(session.user.plan);
  if (!(await planMeetsRequirement(plan, requiredPlan))) {
    redirect("/signature");
  }

  if (!session.user.plan) {
    redirect("/signature");
  }

  const clinics = (session.user.clinics ?? []) as ClinicSummary[];
  const cookieClinicId = await readActiveClinicIdFromCookies();
  const { activeClinic, activeClinicId } = selectActiveClinic(
    clinics,
    cookieClinicId,
  );

  if (!activeClinic) {
    redirect("/clinic-form");
  }

  return {
    session,
    plan,
    clinics,
    activeClinic,
    activeClinicId,
  };
}
