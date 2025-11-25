"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/db";
import {
  clinicNichesTable,
  clinicsTable,
  usersToClinicsTable,
} from "@/db/schema";
import { auth } from "@/lib/auth";

interface UpdateClinicInput {
  clinicId: string;
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
  timezone: string;
}

export const updateClinic = async (input: UpdateClinicInput) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    throw new Error("Não autorizado");
  }

  // Verificar se usuário tem acesso à clínica
  const membership = await db.query.usersToClinicsTable.findFirst({
    where: and(
      eq(usersToClinicsTable.userId, session.user.id),
      eq(usersToClinicsTable.clinicId, input.clinicId),
    ),
  });

  if (!membership) {
    throw new Error("Você não tem permissão para editar esta clínica");
  }

  // Validar CNPJ duplicado (exceto a própria clínica)
  const existingClinicWithCnpj = await db.query.clinicsTable.findFirst({
    where: eq(clinicsTable.cnpj, input.cnpj),
  });

  if (existingClinicWithCnpj && existingClinicWithCnpj.id !== input.clinicId) {
    throw new Error("Já existe outra clínica cadastrada com este CNPJ");
  }

  // Validar nicho
  const niche = await db.query.clinicNichesTable.findFirst({
    where: eq(clinicNichesTable.id, input.nicheId),
  });

  if (!niche) {
    throw new Error("Nicho não encontrado");
  }

  await db
    .update(clinicsTable)
    .set({
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
      timezone: input.timezone,
    })
    .where(eq(clinicsTable.id, input.clinicId));

  revalidatePath("/", "layout");
};
