import { headers } from "next/headers";
import { NextRequest } from "next/server";

import { auth } from "@/lib/auth";
import { readActiveClinicIdFromCookies } from "@/lib/clinic-session";

export async function verifyTenant(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  console.error(req);

  const activeClinicId = await readActiveClinicIdFromCookies();

  if (!activeClinicId) {
    return { success: false, error: "No active clinic" };
  }

  // Check if user belongs to this clinic
  const userClinics = session.user.clinics || [];
  const hasAccess = userClinics.some((c) => c.id === activeClinicId);

  if (!hasAccess) {
    return { success: false, error: "Access denied to this clinic" };
  }

  return { success: true, tenantId: activeClinicId, user: session.user };
}
