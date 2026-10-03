import { NextResponse } from "next/server";
import { isConnected } from "@/lib/spotify";

export async function GET() {
  return NextResponse.json({ connected: await isConnected() });
}
