import { NextRequest, NextResponse } from "next/server";
import { getSupabase, isDbConfigured, type PromptRow } from "@/lib/db";

export const runtime = "nodejs";

const TABLE = "prompts";

export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({ configured: false, prompts: [] satisfies PromptRow[] });
  }
  const supabase = getSupabase()!;
  const { data, error } = await supabase
    .from(TABLE)
    .select("id,title,content,created_at")
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ configured: true, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ configured: true, prompts: data ?? [] });
}

export async function POST(req: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 400 });
  }
  const { title, content } = (await req.json()) as { title: string; content: string };
  if (!title || !content) {
    return NextResponse.json({ error: "Missing title or content" }, { status: 400 });
  }
  const supabase = getSupabase()!;
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ title, content })
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ prompt: data });
}

export async function DELETE(req: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 400 });
  }
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const supabase = getSupabase()!;
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
