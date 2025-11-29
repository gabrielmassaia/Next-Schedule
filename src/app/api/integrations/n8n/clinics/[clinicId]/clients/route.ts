import { NextRequest, NextResponse } from "next/server";

import { upsertClinicClient } from "@/lib/clients";
import { assertServiceToken } from "@/lib/service-token";
import { upsertClientSchema } from "@/lib/validations/clients";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clinicId: string }> },
) {
  const authError = assertServiceToken(req);
  if (authError) return authError;

  const { clinicId } = await params;

  try {
    const body = await req.json();

    // Ensure clinicId in body matches path
    const payload = { ...body, clinicId };

    const parsed = upsertClientSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // Upsert client using shared logic
    // We let the service handle limits (it will check clinic_features or plan)
    await upsertClinicClient(parsed.data);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 },
    );
  }
}
