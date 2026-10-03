import { NextResponse } from "next/server";

/* Health check for uptime monitors and platform probes. */
export function GET() {
  return NextResponse.json({ ok: true });
}
