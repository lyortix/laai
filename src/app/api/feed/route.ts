import { NextResponse } from "next/server";
import { getPublicRoasts } from "@/lib/public/roasts";

export const runtime = "nodejs";

/** Cursor-paginated public feed for infinite scroll. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor") ?? undefined;
  const page = await getPublicRoasts(cursor);
  return NextResponse.json(page);
}
