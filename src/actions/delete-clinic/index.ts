"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { clinicsTable, usersToClinicsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { ACTIVE_CLINIC_COOKIE } from "@/lib/clinic-session";

export const deleteClinic = async (clinicId: string) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    throw new Error("Não autorizado");
  }

  // Verificar se usuário tem acesso
  const membership = await db.query.usersToClinicsTable.findFirst({
    where: and(
      eq(usersToClinicsTable.userId, session.user.id),
      eq(usersToClinicsTable.clinicId, clinicId),
    ),
  });

  if (!membership) {
    throw new Error("Você não tem permissão para excluir esta clínica");
  }

  // Deletar vínculos usuário-clínica primeiro (foreign key)
  await db
    .delete(usersToClinicsTable)
    .where(eq(usersToClinicsTable.clinicId, clinicId));

  // Deletar clínica (cascade deletará profissionais, clientes, etc)
  await db.delete(clinicsTable).where(eq(clinicsTable.id, clinicId));

  // Buscar outras clínicas do usuário
  const remainingClinics = await db.query.usersToClinicsTable.findMany({
    where: eq(usersToClinicsTable.userId, session.user.id),
    with: { clinic: true },
  });

  const cookieStore = await cookies();

  if (remainingClinics.length > 0) {
    // Setar primeira clínica restante como ativa
    cookieStore.set(ACTIVE_CLINIC_COOKIE, remainingClinics[0].clinicId, {
      path: "/",
      sameSite: "lax",
      httpOnly: false,
    });
  } else {
    // Limpar cookie se não há mais clínicas
    cookieStore.delete(ACTIVE_CLINIC_COOKIE);
  }

  revalidatePath("/", "layout");

  // Redirecionar baseado em clínicas restantes
  if (remainingClinics.length > 0) {
    redirect("/dashboard");
  } else {
    redirect("/clinic-form");
  }
};
