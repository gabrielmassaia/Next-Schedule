"use server";

import { eq } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { getPlanBySlug } from "@/data/subscription-plans";
import { db } from "@/db";
import {
  clinicNichesTable,
  clinicsTable,
  usersToClinicsTable,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import { ACTIVE_CLINIC_COOKIE } from "@/lib/clinic-session";

interface CreateClinicInput {
  name: string;
  cnpj: string;
  phone: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  nicheId: string;
}

export const createClinic = async (input: CreateClinicInput) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Não autorizado");
  }

  const plan = await getPlanBySlug(session.user.plan);
  const clinics = await db.query.usersToClinicsTable.findMany({
    where: eq(usersToClinicsTable.userId, session.user.id),
  });

  if (
    typeof plan.limits.clinics === "number" &&
    clinics.length >= plan.limits.clinics
  ) {
    throw new Error(
      "Limite de clínicas do plano atingido. Faça upgrade para criar novas clínicas.",
    );
  }

  const niche = await db.query.clinicNichesTable.findFirst({
    where: eq(clinicNichesTable.id, input.nicheId),
  });

  if (!niche) {
    throw new Error("Nicho não encontrado");
  }

  const [clinic] = await db
    .insert(clinicsTable)
    .values({
      name: input.name,
      cnpj: input.cnpj,
      phone: input.phone,
      email: input.email,
      addressLine1: input.addressLine1,
      addressLine2: input.addressLine2,
      city: input.city,
      state: input.state,
      zipCode: input.zipCode,
      nicheId: input.nicheId,
    })
    .returning();

  await db.insert(usersToClinicsTable).values({
    userId: session.user.id,
    clinicId: clinic.id,
  });

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_CLINIC_COOKIE, clinic.id, {
    path: "/",
    sameSite: "lax",
    httpOnly: false,
  });
  redirect("/dashboard");
};
