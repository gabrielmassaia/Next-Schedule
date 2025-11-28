import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getClinicNiches } from "@/data/clinic-niches";
import { getPlanBySlug } from "@/data/subscription-plans";
import { auth } from "@/lib/auth";

import { ClinicCreationModal } from "./_components/clinic-creation-modal";

export default async function ClinicFormPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/authentication");
  }

  if (!session.user.plan) {
    redirect("/signature");
  }

  const clinics = session.user.clinics ?? [];
  const plan = await getPlanBySlug(session.user.plan);
  const clinicsLimit = plan.limits.clinics;

  // Limit check removed to prevent redirect loops with stale sessions.
  // The createClinic action enforces the limit.

  const niches = await getClinicNiches();

  return (
    <div>
      <div>
        <ClinicCreationModal niches={niches} />
      </div>
    </div>
  );
}
