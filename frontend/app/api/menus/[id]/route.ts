import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, href, icon, priority } = body;

    const { data, error } = await supabase
      .from("menus")
      .update({ name, href, icon, priority: Number(priority) })
      .eq("id", id)
      .select();

    if (error) throw error;
    return NextResponse.json(data[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { error } = await supabase.from("menus").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ message: "삭제 성공" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}