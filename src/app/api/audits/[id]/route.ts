import { NextResponse } from "next/server";
import { z } from "zod";
import { generateUniqueSlug } from "@/lib/public/slug";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const patchSchema = z.object({ is_public: z.boolean() });

/** Toggle an audit's public visibility (owner only). Assigns a slug on first publish. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const parsed = patchSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { data: audit } = await supabase
    .from("audits")
    .select("id, slug, status, url")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!audit) {
    return NextResponse.json({ error: "Audit not found." }, { status: 404 });
  }
  if (parsed.data.is_public && audit.status !== "complete") {
    return NextResponse.json(
      { error: "Only completed audits can be made public." },
      { status: 400 }
    );
  }

  // Slug is assigned once, on first publish, and kept stable thereafter.
  const slug = audit.slug ?? (await generateUniqueSlug(supabase, audit.url));
  const { error } = await supabase
    .from("audits")
    .update({
      is_public: parsed.data.is_public,
      slug,
      public_at: parsed.data.is_public ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Could not update the audit." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, is_public: parsed.data.is_public, slug });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { error } = await supabase
    .from("audits")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Could not delete the audit." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
