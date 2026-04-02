import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 1. 고객 목록 조회 (실시간 필터 반영)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const tm_id = searchParams.get("tm_id") || "all";
  const consult_status = searchParams.get("consult_status") || "all";
  const sales_status = searchParams.get("sales_status") || "all";

  let query = supabase.from("customers").select("*");

  if (search) {
    query = query.or(`customer_name.ilike.%${search}%,company_name.ilike.%${search}%,mobile_phone.ilike.%${search}%`);
  }
  if (tm_id !== "all") query = query.eq("tm_id", tm_id);
  if (consult_status !== "all") query = query.eq("consult_status", consult_status);
  if (sales_status !== "all") query = query.eq("sales_status", sales_status);

  const { data, error } = await query.order("receipt_date", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// 2. 신규 고객 등록
export async function POST(request: Request) {
  const body = await request.json();
  const { data, error } = await supabase.from("customers").insert([body]).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data[0]);
}

// 3. 일괄 담당자 배정 (PATCH)
export async function PATCH(request: Request) {
  try {
    const { ids, type, assignee_id } = await request.json();
    const column = type === 'TM' ? 'tm_id' : 'sales_id';

    const { error } = await supabase
      .from("customers")
      .update({ [column]: assignee_id })
      .in("id", ids);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}