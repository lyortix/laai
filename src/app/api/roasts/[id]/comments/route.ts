import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const bodySchema = z.object({ body: z.string().trim().min(1).max(2000) });

/** Post a comment on a public roast (authenticated users only). */
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
  if (!parsed.success) return NextResponse.json({ error: "Comment can't be empty." }, { status: 400 });

  const { data: audit } = await supabase
    .from("audits")
    .select("id")
    .eq("id", id)
    .eq("is_public", true)
    .maybeSingle();
  if (!audit) return NextResponse.json({ error: "Roast not found." }, { status: 404 });

  const { error } = await supabase
    .from("roast_comments")
    .insert({ audit_id: id, user_id: user.id, body: parsed.data.body });

  if (error) return NextResponse.json({ error: "Could not post comment." }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
