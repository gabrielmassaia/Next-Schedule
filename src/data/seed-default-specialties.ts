"use server";

import { MedicalSpecialty } from "@/app/(protected)/professionals/_constants";
import { db } from "@/db";
import { specialtiesTable } from "@/db/schema";

/**
 * Seeds default specialties from the constants into the database
 * Run this once to populate default specialties
 */
export async function seedDefaultSpecialties() {
  try {
    const specialties = Object.entries(MedicalSpecialty).map(([, value]) => ({
      name: value,
      isDefault: true,
      clinicId: null,
      nicheId: null,
    }));

    // Check if default specialties already exist
    const existing = await db.query.specialtiesTable.findMany({
      where: (specialties, { eq }) => eq(specialties.isDefault, true),
    });

    if (existing.length > 0) {
      console.log("Default specialties already seeded");
      return { success: true, message: "Already seeded" };
    }

    await db.insert(specialtiesTable).values(specialties);

    console.log(`Seeded ${specialties.length} default specialties`);
    return { success: true, count: specialties.length };
  } catch (error) {
    console.error("Error seeding specialties:", error);
    throw new Error("Erro ao popular especialidades padrão");
  }
}
