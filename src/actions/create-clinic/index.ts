"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";

import { getPlanBySlug } from "@/data/subscription-plans";
import { db } from "@/db";
import {
  clientsTable,
  clinicNichesTable,
  clinicsTable,
  professionalsTable,
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
  // New fields
  hasLunchBreak: boolean;
  lunchBreakStart?: string;
  lunchBreakEnd?: string;
  serviceType?: "convenio" | "particular" | "ambos";
  paymentMethods: string[];
  hasParking: boolean;
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

  // Validar CNPJ duplicado
  const existingClinicWithCnpj = await db.query.clinicsTable.findFirst({
    where: eq(clinicsTable.cnpj, input.cnpj),
  });

  if (existingClinicWithCnpj) {
    throw new Error("Já existe uma clínica cadastrada com este CNPJ");
  }

  // Validar Telefone duplicado (Clínicas, Clientes, Profissionais)
  const existingClinicWithPhone = await db.query.clinicsTable.findFirst({
    where: eq(clinicsTable.phone, input.phone),
  });

  if (existingClinicWithPhone) {
    throw new Error("Já existe uma clínica cadastrada com este telefone");
  }

  const existingClientWithPhone = await db.query.clientsTable.findFirst({
    where: eq(clientsTable.phoneNumber, input.phone),
  });

  if (existingClientWithPhone) {
    throw new Error(
      "Este telefone já está cadastrado para um cliente. O telefone da clínica não pode ser igual ao de um cliente.",
    );
  }

  const existingProfessionalWithPhone =
    await db.query.professionalsTable.findFirst({
      where: eq(professionalsTable.phone, input.phone),
    });

  if (existingProfessionalWithPhone) {
    throw new Error(
      "Este telefone já está cadastrado para um profissional. O telefone da clínica não pode ser igual ao de um profissional.",
    );
  }

  // Validar Email duplicado (Clínicas, Clientes)
  if (input.email) {
    const existingClinicWithEmail = await db.query.clinicsTable.findFirst({
      where: eq(clinicsTable.email, input.email),
    });

    if (existingClinicWithEmail) {
      throw new Error("Já existe uma clínica cadastrada com este email");
    }

    const existingClientWithEmail = await db.query.clientsTable.findFirst({
      where: eq(clientsTable.email, input.email),
    });

    if (existingClientWithEmail) {
      throw new Error(
        "Este email já está cadastrado para um cliente. O email da clínica não pode ser igual ao de um cliente.",
      );
    }
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
      hasLunchBreak: input.hasLunchBreak,
      lunchBreakStart: input.lunchBreakStart,
      lunchBreakEnd: input.lunchBreakEnd,
      serviceType: input.serviceType,
      paymentMethods: input.paymentMethods,
      hasParking: input.hasParking,
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

  // Revalidar todas as páginas protegidas para atualizar a session
  revalidatePath("/", "layout");

  return { success: true, clinicId: clinic.id };
};
