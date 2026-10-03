import { NextResponse } from "next/server";

/* Health check for uptime monitors and platform probes (legacy path). */
export function GET() {
  return NextResponse.json({ ok: true });
}
