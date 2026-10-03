import { NextResponse } from "next/server";
import { getLastPlayed } from "@/lib/spotify";

export async function GET() {
  try {
    return NextResponse.json(await getLastPlayed());
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
