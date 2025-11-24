"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { clinicInsurancePlansTable } from "@/db/schema";

interface InsurancePlan {
  id?: string;
  name: string;
  ansRegistration?: string;
  isManual: boolean;
}

export async function upsertInsurancePlans(
  clinicId: string,
  plans: InsurancePlan[],
) {
  try {
    // Delete existing plans for this clinic
    await db
      .delete(clinicInsurancePlansTable)
      .where(eq(clinicInsurancePlansTable.clinicId, clinicId));

    // Insert new plans
    if (plans.length > 0) {
      await db.insert(clinicInsurancePlansTable).values(
        plans.map((plan) => ({
          clinicId,
          planName: plan.name,
          ansRegistration: plan.ansRegistration,
          isManual: plan.isManual,
        })),
      );
    }

    revalidatePath("/", "layout");

    return { success: true };
  } catch (error) {
    console.error("Error upserting insurance plans:", error);
    throw new Error("Erro ao salvar planos de convênio");
  }
}

export async function getInsurancePlans(clinicId: string) {
  try {
    const plans = await db.query.clinicInsurancePlansTable.findMany({
      where: eq(clinicInsurancePlansTable.clinicId, clinicId),
    });

    return plans.map((plan) => ({
      id: plan.id,
      name: plan.planName,
      ansRegistration: plan.ansRegistration || undefined,
      isManual: plan.isManual,
    }));
  } catch (error) {
    console.error("Error getting insurance plans:", error);
    throw new Error("Erro ao buscar planos de convênio");
  }
}
