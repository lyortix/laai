import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const bodySchema = z.object({ rating: z.number().int().min(1).max(5) });

/** Upsert the current user's 1–5 rating for a public roast. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid rating." }, { status: 400 });

  // Only allow rating a genuinely public roast.
  const { data: audit } = await supabase
    .from("audits")
    .select("id")
    .eq("id", id)
    .eq("is_public", true)
    .maybeSingle();
  if (!audit) return NextResponse.json({ error: "Roast not found." }, { status: 404 });

  const { error } = await supabase
    .from("roast_ratings")
    .upsert({ audit_id: id, user_id: user.id, rating: parsed.data.rating }, { onConflict: "audit_id,user_id" });

  if (error) return NextResponse.json({ error: "Could not save rating." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
