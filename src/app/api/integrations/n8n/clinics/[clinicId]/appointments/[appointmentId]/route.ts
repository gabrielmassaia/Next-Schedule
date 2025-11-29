import { NextRequest, NextResponse } from "next/server";

import { updateClinicAppointment } from "@/lib/appointments";
import { assertServiceToken } from "@/lib/service-token";
import { updateAppointmentSchema } from "@/lib/validations/appointments";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ clinicId: string; appointmentId: string }> },
) {
  const authError = assertServiceToken(req);
  if (authError) return authError;

  const { clinicId, appointmentId } = await params;

  try {
    const body = await req.json();

    // Ensure IDs match path
    const payload = {
      ...body,
      clinicId,
      id: appointmentId,
    };

    // Pre-process date to Date object if string
    if (typeof payload.date === "string") {
      payload.date = new Date(payload.date);
    }

    const parsed = updateAppointmentSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    await updateClinicAppointment(parsed.data);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 },
    );
  }
}
