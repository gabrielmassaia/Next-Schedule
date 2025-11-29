import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { professionalsTable } from "@/db/schema";
import { getClinicAvailability } from "@/lib/availability";
import { assertServiceToken } from "@/lib/service-token";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clinicId: string }> },
) {
  const authError = assertServiceToken(req);
  if (authError) return authError;

  const { clinicId } = await params;
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const professionalId = searchParams.get("professionalId");

  if (!date) {
    return NextResponse.json(
      { error: "Missing date parameter" },
      { status: 400 },
    );
  }

  // If professionalId is not provided, we should probably fail or pick one?
  // The spec says: "professionalId: obrigatório quando a clínica tem mais de um profissional. opcional se só houver um profissional."
  // For now, let's enforce it or fetch the single one.
  // To keep it simple and robust, let's require it if not provided, OR fetch the first one.

  let targetProfessionalId = professionalId;

  if (!targetProfessionalId) {
    const professionals = await db.query.professionalsTable.findMany({
      where: eq(professionalsTable.clinicId, clinicId),
      columns: { id: true },
    });

    if (professionals.length === 1) {
      targetProfessionalId = professionals[0].id;
    } else if (professionals.length > 1) {
      return NextResponse.json(
        { error: "Multiple professionals found, professionalId is required" },
        { status: 400 },
      );
    } else {
      return NextResponse.json(
        { error: "No professionals found for this clinic" },
        { status: 404 },
      );
    }
  }

  try {
    const slots = await getClinicAvailability({
      clinicId,
      professionalId: targetProfessionalId,
      date,
    });
    return NextResponse.json(slots);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 },
    );
  }
}
