import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/** Like a comment (idempotent). */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { error } = await supabase
    .from("roast_comment_likes")
    .upsert({ comment_id: id, user_id: user.id }, { onConflict: "comment_id,user_id" });
  if (error) return NextResponse.json({ error: "Could not like." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/** Remove a like. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { error } = await supabase
    .from("roast_comment_likes")
    .delete()
    .eq("comment_id", id)
    .eq("user_id", user.id);
  if (error) return NextResponse.json({ error: "Could not unlike." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
