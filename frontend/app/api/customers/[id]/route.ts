import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// [GET] 고객 조회 (검색 및 필터링 반영)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const tm_id = searchParams.get("tm_id") || "all";
  const consult_status = searchParams.get("consult_status") || "all";

  let query = supabase.from("customers").select("*");

  if (search) query = query.or(`company_name.ilike.%${search}%,customer_name.ilike.%${search}%`);
  if (tm_id !== "all") query = query.eq("tm_id", tm_id);
  if (consult_status !== "all") query = query.eq("consult_status", consult_status);

  const { data, error } = await query.order("created_at", { ascending: false });
  return NextResponse.json(data || []);
}

// [PATCH] 일괄 담당자 배정 기능
export async function PATCH(request: Request) {
  const { ids, type, assignee_id } = await request.json();
  const column = type === 'TM' ? 'tm_id' : 'sales_id';

  const { error } = await supabase
    .from("customers")
    .update({ [column]: assignee_id })
    .in("id", ids);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}