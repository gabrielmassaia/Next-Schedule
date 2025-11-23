"use server";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { specialtiesTable } from "@/db/schema";

export async function getClinicSpecialties(clinicId: string) {
  try {
    // Get default specialties (isDefault = true, clinicId = null)
    const defaultSpecialties = await db.query.specialtiesTable.findMany({
      where: eq(specialtiesTable.isDefault, true),
    });

    // Get clinic-specific specialties
    const clinicSpecialties = await db.query.specialtiesTable.findMany({
      where: eq(specialtiesTable.clinicId, clinicId),
    });

    return [...defaultSpecialties, ...clinicSpecialties];
  } catch (error) {
    console.error("Error fetching specialties:", error);
    throw new Error("Erro ao buscar especialidades");
  }
}

export async function createSpecialty(clinicId: string, name: string) {
  try {
    const [specialty] = await db
      .insert(specialtiesTable)
      .values({
        clinicId,
        name,
        isDefault: false,
      })
      .returning();

    return specialty;
  } catch (error) {
    console.error("Error creating specialty:", error);
    throw new Error("Erro ao criar especialidade");
  }
}

export async function updateSpecialty(id: string, name: string) {
  try {
    await db
      .update(specialtiesTable)
      .set({ name })
      .where(eq(specialtiesTable.id, id));

    return { success: true };
  } catch (error) {
    console.error("Error updating specialty:", error);
    throw new Error("Erro ao atualizar especialidade");
  }
}

export async function deleteSpecialty(id: string) {
  try {
    // Only allow deleting custom specialties (not default ones)
    const specialty = await db.query.specialtiesTable.findFirst({
      where: eq(specialtiesTable.id, id),
    });

    if (!specialty) {
      throw new Error("Especialidade não encontrada");
    }

    if (specialty.isDefault) {
      throw new Error("Não é possível excluir especialidades padrão");
    }

    await db.delete(specialtiesTable).where(eq(specialtiesTable.id, id));

    return { success: true };
  } catch (error) {
    console.error("Error deleting specialty:", error);
    throw new Error(
      error instanceof Error ? error.message : "Erro ao excluir especialidade",
    );
  }
}
