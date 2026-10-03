import { redirect } from "next/navigation";
import { getLoginUrl } from "@/lib/spotify";

export function GET() {
  redirect(getLoginUrl());
}
