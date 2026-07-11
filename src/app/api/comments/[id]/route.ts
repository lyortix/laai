import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** Author or admin deletes a comment. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  // RLS enforces "own comment or admin"; this call simply relays the result.
  const { error } = await supabase.from("roast_comments").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "Could not delete comment." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

const patchSchema = z.object({
  pinned: z.boolean().optional(),
  hidden: z.boolean().optional(),
});

/** Admin moderation: pin/unpin and hide/unhide. RLS restricts to admins. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const parsed = patchSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success || (parsed.data.pinned === undefined && parsed.data.hidden === undefined)) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const { error } = await supabase.from("roast_comments").update(parsed.data).eq("id", id);
  if (error) {
    // RLS denial surfaces here for non-admins.
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }
  return NextResponse.json({ ok: true });
}
