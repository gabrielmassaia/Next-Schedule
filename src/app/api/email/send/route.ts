import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { sendEmail } from "@/lib/email/resend";
import { verifyTenant } from "@/lib/verify-tenant";

const schema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  html: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const tenantVerification = await verifyTenant(req);
    if (!tenantVerification.success) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: tenantVerification.error },
        },
        { status: 401 },
      );
    }

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

    const { to, subject, html } = parsed.data;

    const result = await sendEmail({ to, subject, html });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "EMAIL_SEND_FAILED", message: "Failed to send email" },
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error("Error in email/send:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Internal server error" },
      },
      { status: 500 },
    );
  }
}
