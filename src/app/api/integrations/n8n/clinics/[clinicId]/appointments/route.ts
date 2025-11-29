import { NextRequest, NextResponse } from "next/server";

import { createClinicAppointment } from "@/lib/appointments";
import { assertServiceToken } from "@/lib/service-token";
import { addAppointmentSchema } from "@/lib/validations/appointments";

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

    // Pre-process date to Date object if string
    if (typeof payload.date === "string") {
      payload.date = new Date(payload.date);
    }

    const parsed = addAppointmentSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const appointment = await createClinicAppointment(parsed.data);

    return NextResponse.json(appointment);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 },
    );
  }
}
