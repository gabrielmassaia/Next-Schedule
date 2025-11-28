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

/**
 * Validates user authentication, plan level, and active clinic.
 *
 * @param minimumPlanRequired - The minimum plan slug required to access the feature.
 *                              Defaults to "essential" (lowest tier).
 * @returns User session, their actual plan, clinics, and active clinic info.
 *
 * @throws Redirects to /authentication if not logged in
 * @throws Redirects to /signature if user's plan doesn't meet minimum requirement
 * @throws Redirects to /clinic-form if no active clinic
 *
 * @example
 * // Most features only need authentication + active clinic (essential is default)
 * const { activeClinic, plan } = await requirePlan();
 *
 * @example
 * // Advanced features requiring Pro or higher
 * const { activeClinic, plan } = await requirePlan("pro");
 */
export async function requirePlan(
  minimumPlanRequired: SubscriptionPlanSlug = DEFAULT_PLAN_SLUG,
  options: { redirectOnMissingClinic?: boolean } = {
    redirectOnMissingClinic: true,
  },
): Promise<RequirePlanResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/authentication");
  }

  // Get the user's ACTUAL plan from their session
  const userPlan = await getPlanBySlug(session.user.plan);

  // Validate if user's plan meets the minimum requirement for this feature
  if (!(await planMeetsRequirement(userPlan, minimumPlanRequired))) {
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

  if (!activeClinic && options.redirectOnMissingClinic) {
    redirect("/clinic-form");
  }

  return {
    session,
    plan: userPlan, // Returns the user's actual plan
    clinics,
    activeClinic,
    activeClinicId,
  };
}
