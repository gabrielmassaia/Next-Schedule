import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { usersToClinicsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { ACTIVE_CLINIC_COOKIE, selectActiveClinic } from "@/lib/clinic-session";

/**
 * @swagger
 * /api/clinics/active:
 *   get:
 *     summary: Get active clinic ID
 *     tags:
 *       - Clinics
 *     security:
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: Active clinic ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 activeClinicId:
 *                   type: string
 *                   nullable: true
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ activeClinicId: null }, { status: 401 });
  }

  const clinics = await db.query.usersToClinicsTable.findMany({
    where: eq(usersToClinicsTable.userId, session.user.id),
    with: {
      clinic: {
        with: {
          niche: true,
        },
      },
    },
  });

  const clinicSummaries = clinics.map((uc) => uc.clinic);

  const cookieClinicId =
    request.cookies.get(ACTIVE_CLINIC_COOKIE)?.value ?? null;
  const { activeClinicId } = selectActiveClinic(
    clinicSummaries,
    cookieClinicId,
  );

  const response = NextResponse.json({ activeClinicId });

  // Se calculamos um ID mas o cookie estava diferente (ou null), atualizamos o cookie
  if (activeClinicId && activeClinicId !== cookieClinicId) {
    response.cookies.set(ACTIVE_CLINIC_COOKIE, activeClinicId, {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
    });
  }

  return response;
}

/**
 * @swagger
 * /api/clinics/active:
 *   post:
 *     summary: Set active clinic
 *     tags:
 *       - Clinics
 *     security:
 *       - CookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - clinicId
 *             properties:
 *               clinicId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Active clinic set
 *       400:
 *         description: Missing clinicId
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Clinic not found
 */
export async function POST(request: NextRequest) {
  const body = (await request.json()) as { clinicId?: string };
  const clinicId = body?.clinicId;
  if (!clinicId) {
    return NextResponse.json(
      { message: "clinicId é obrigatório" },
      { status: 400 },
    );
  }

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  const membership = await db.query.usersToClinicsTable.findFirst({
    where: and(
      eq(usersToClinicsTable.userId, session.user.id),
      eq(usersToClinicsTable.clinicId, clinicId),
    ),
  });

  if (!membership) {
    return NextResponse.json(
      { message: "Clínica não encontrada" },
      { status: 404 },
    );
  }

  const response = NextResponse.json({ activeClinicId: clinicId });
  response.cookies.set(ACTIVE_CLINIC_COOKIE, clinicId, {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
  });

  // Revalidar todas as páginas protegidas para atualizar com nova clínica
  revalidatePath("/", "layout");

  return response;
}
