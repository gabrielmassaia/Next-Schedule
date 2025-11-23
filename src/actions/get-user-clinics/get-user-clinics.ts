"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";

import { db } from "@/db";
import { usersToClinicsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import type { ClinicSummary } from "@/lib/clinic-session";

export async function getUserClinics(): Promise<ClinicSummary[]> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return [];
  }

  const userClinics = await db.query.usersToClinicsTable.findMany({
    where: eq(usersToClinicsTable.userId, session.user.id),
    with: {
      clinic: {
        with: {
          niche: true,
        },
      },
    },
  });

  return userClinics.map((uc) => ({
    id: uc.clinic.id,
    name: uc.clinic.name,
    niche: uc.clinic.niche,
    cnpj: uc.clinic.cnpj,
    phone: uc.clinic.phone,
    email: uc.clinic.email,
    addressLine1: uc.clinic.addressLine1,
    addressLine2: uc.clinic.addressLine2,
    city: uc.clinic.city,
    state: uc.clinic.state,
    zipCode: uc.clinic.zipCode,
  }));
}
