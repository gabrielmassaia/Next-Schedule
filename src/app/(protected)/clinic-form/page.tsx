import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getClinicNiches } from "@/data/clinic-niches";
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

  const niches = await getClinicNiches();

  return (
    <div>
      <div>
        <ClinicCreationModal niches={niches} />
      </div>
    </div>
  );
}
