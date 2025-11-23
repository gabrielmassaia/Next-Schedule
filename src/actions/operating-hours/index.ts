"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { clinicOperatingHoursTable } from "@/db/schema";

interface OperatingHour {
  dayOfWeek: number;
  isActive: boolean;
  startTime: string;
  endTime: string;
}

export async function upsertOperatingHours(
  clinicId: string,
  operatingHours: OperatingHour[],
) {
  try {
    // Delete existing operating hours for this clinic
    await db
      .delete(clinicOperatingHoursTable)
      .where(eq(clinicOperatingHoursTable.clinicId, clinicId));

    // Insert new operating hours (only for active days)
    const activeHours = operatingHours.filter((hour) => hour.isActive);

    if (activeHours.length > 0) {
      await db.insert(clinicOperatingHoursTable).values(
        activeHours.map((hour) => ({
          clinicId,
          dayOfWeek: hour.dayOfWeek,
          isActive: hour.isActive,
          startTime: hour.startTime,
          endTime: hour.endTime,
        })),
      );
    }

    revalidatePath("/", "layout");

    return { success: true };
  } catch (error) {
    console.error("Error upserting operating hours:", error);
    throw new Error("Erro ao salvar horários de funcionamento");
  }
}

export async function getOperatingHours(clinicId: string) {
  try {
    const hours = await db.query.clinicOperatingHoursTable.findMany({
      where: eq(clinicOperatingHoursTable.clinicId, clinicId),
    });

    // Return all days with default inactive if not found
    const allDays = [1, 2, 3, 4, 5, 6, 0]; // Mon-Sun
    return allDays.map((day) => {
      const existing = hours.find((h) => h.dayOfWeek === day);
      return (
        existing || {
          dayOfWeek: day,
          isActive: false,
          startTime: "08:00",
          endTime: "18:00",
        }
      );
    });
  } catch (error) {
    console.error("Error getting operating hours:", error);
    throw new Error("Erro ao buscar horários de funcionamento");
  }
}
