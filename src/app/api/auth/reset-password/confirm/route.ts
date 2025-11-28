import bcrypt from "bcryptjs";
import { and, eq, gt } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import {
  accountsTable,
  passwordResetTokensTable,
  usersTable,
} from "@/db/schema";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
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

    const { token, password } = parsed.data;

    // Validate token
    const resetToken = await db.query.passwordResetTokensTable.findFirst({
      where: and(
        eq(passwordResetTokensTable.token, token),
        gt(passwordResetTokensTable.expiresAt, new Date()),
      ),
    });

    if (!resetToken) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "INVALID_TOKEN", message: "Invalid or expired token" },
        },
        { status: 400 },
      );
    }

    // Find user
    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.email, resetToken.email),
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "USER_NOT_FOUND", message: "User not found" },
        },
        { status: 404 },
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password in accounts table for the credential provider
    const account = await db.query.accountsTable.findFirst({
      where: and(
        eq(accountsTable.userId, user.id),
        eq(accountsTable.providerId, "credential"),
      ),
    });

    if (account) {
      await db
        .update(accountsTable)
        .set({ password: hashedPassword, updatedAt: new Date() })
        .where(eq(accountsTable.id, account.id));
    } else {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NO_PASSWORD_ACCOUNT",
            message: "No password account found for this user",
          },
        },
        { status: 400 },
      );
    }

    // Delete token
    await db
      .delete(passwordResetTokensTable)
      .where(eq(passwordResetTokensTable.id, resetToken.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in reset-password/confirm:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Internal server error" },
      },
      { status: 500 },
    );
  }
}
