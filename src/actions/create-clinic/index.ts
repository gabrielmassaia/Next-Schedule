"use server";

import { eq } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { getPlanBySlug } from "@/data/subscription-plans";
import { db } from "@/db";
import { clinicsTable, usersToClinicsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { ACTIVE_CLINIC_COOKIE } from "@/lib/clinic-session";

export const createClinic = async (name: string) => {
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

  const [clinic] = await db
    .insert(clinicsTable)
    .values({
      name,
    })
    .returning();

  await db.insert(usersToClinicsTable).values({
    userId: session.user.id,
    clinicId: clinic.id,
  });

  const cookieStore = cookies();
  cookieStore.set(ACTIVE_CLINIC_COOKIE, clinic.id, {
    path: "/",
    sameSite: "lax",
    httpOnly: false,
  });
  redirect("/dashboard");
};
