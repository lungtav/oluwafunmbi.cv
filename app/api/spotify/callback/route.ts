import { NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/spotify";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return new NextResponse(`Spotify authorization failed: ${error}`, {
      status: 400,
    });
  }
  if (!code) {
    return new NextResponse("No authorization code received", { status: 400 });
  }

  try {
    await exchangeCodeForTokens(code);
    const frontendUrl =
      process.env.FRONTEND_URL?.split(",")[0]?.trim() || new URL(request.url).origin;
    return NextResponse.redirect(frontendUrl);
  } catch (err) {
    console.error(err);
    return new NextResponse("Spotify authentication failed", { status: 500 });
  }
}
