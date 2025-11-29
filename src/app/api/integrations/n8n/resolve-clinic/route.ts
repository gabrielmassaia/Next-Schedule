import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { clinicWhatsappNumbersTable } from "@/db/schema";
import { assertServiceToken } from "@/lib/service-token";

export async function GET(req: NextRequest) {
  const authError = assertServiceToken(req);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const phone = searchParams.get("phone");

  if (!phone) {
    return NextResponse.json(
      { error: "Missing phone parameter" },
      { status: 400 },
    );
  }

  // Normalize phone (simple check, assuming E.164 is passed or at least consistent)
  // Ideally we should have a normalization lib, but for now we trust the input or do basic strip
  // The requirement says "Normalizar phone para E.164", but usually N8N sends it normalized or we do it here.
  // Let's assume the input should be matched exactly for now, or we can strip non-digits.
  // If strict E.164 is required, we should ensure it starts with + and has no spaces.

  const normalizedPhone = phone.startsWith("+")
    ? phone
    : `+${phone.replace(/\D/g, "")}`;

  const mapping = await db.query.clinicWhatsappNumbersTable.findFirst({
    where: eq(clinicWhatsappNumbersTable.phone, normalizedPhone),
  });

  if (!mapping) {
    return NextResponse.json({ error: "clinic_not_found" }, { status: 404 });
  }

  return NextResponse.json({ clinicId: mapping.clinicId });
}
