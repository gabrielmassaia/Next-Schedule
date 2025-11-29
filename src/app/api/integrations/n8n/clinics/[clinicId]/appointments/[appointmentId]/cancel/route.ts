import { NextRequest, NextResponse } from "next/server";

import { cancelClinicAppointment } from "@/lib/appointments";
import { assertServiceToken } from "@/lib/service-token";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clinicId: string; appointmentId: string }> },
) {
  const authError = assertServiceToken(req);
  if (authError) return authError;

  const { clinicId, appointmentId } = await params;

  try {
    await cancelClinicAppointment(appointmentId, clinicId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 },
    );
  }
}
