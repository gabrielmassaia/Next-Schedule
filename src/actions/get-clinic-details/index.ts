"use server";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { clinicsTable } from "@/db/schema";

export async function getClinicDetails(clinicId: string) {
  try {
    const clinic = await db.query.clinicsTable.findFirst({
      where: eq(clinicsTable.id, clinicId),
      with: {
        operatingHours: true,
      },
    });

    if (!clinic) {
      throw new Error("Clínica não encontrada");
    }

    return {
      hasLunchBreak: clinic.hasLunchBreak,
      lunchBreakStart: clinic.lunchBreakStart,
      lunchBreakEnd: clinic.lunchBreakEnd,
      operatingHours: clinic.operatingHours,
    };
  } catch (error) {
    console.error("Error getting clinic details:", error);
    throw new Error("Erro ao buscar detalhes da clínica");
  }
}
