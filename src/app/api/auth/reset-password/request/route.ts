import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import {
  passwordResetTokensTable,
  usersTable,
  usersToClinicsTable,
} from "@/db/schema";
import { sendEmail } from "@/lib/email/resend";
import { resetPasswordTemplate } from "@/lib/email/templates/reset-password";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "INVALID_PAYLOAD", message: "Invalid payload" },
          issues: parsed.error.issues,
        },
        { status: 400 },
      );
    }

    const { email } = parsed.data;

    // Check if user exists
    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.email, email),
    });

    if (!user) {
      // Return success to prevent enumeration
      return NextResponse.json({ success: true });
    }

    // Check if user belongs to any clinic (Tenant Validation for unauthenticated flow)
    const userClinics = await db.query.usersToClinicsTable.findMany({
      where: eq(usersToClinicsTable.userId, user.id),
    });

    if (userClinics.length === 0) {
      // User has no clinic access, so effectively not a valid tenant user
      return NextResponse.json({ success: true });
    }

    // Generate token
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    await db.insert(passwordResetTokensTable).values({
      token,
      email,
      expiresAt,
    });

    // Send email
    const emailResult = await sendEmail({
      to: email,
      subject: "Redefinição de Senha",
      html: resetPasswordTemplate(token),
    });

    if (!emailResult.success) {
      console.error("Failed to send reset email:", emailResult.error);
      return NextResponse.json(
        {
          success: false,
          error: { code: "EMAIL_SEND_FAILED", message: "Failed to send email" },
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in reset-password/request:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Internal server error" },
      },
      { status: 500 },
    );
  }
}
