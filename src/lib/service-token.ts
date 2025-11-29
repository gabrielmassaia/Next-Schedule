import { NextRequest, NextResponse } from "next/server";

export function assertServiceToken(req: NextRequest) {
  const token = req.headers.get("X-Service-Token");
  const validToken = process.env.N8N_SERVICE_TOKEN;

  if (!token || token !== validToken) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Invalid or missing service token" },
      { status: 401 },
    );
  }

  return null;
}
