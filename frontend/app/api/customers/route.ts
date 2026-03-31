import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  // 조회 조건들
  const search = searchParams.get("search") || "";
  const tm_id = searchParams.get("tm_id") || "all";
  const status = searchParams.get("status") || "all";

  let query = supabase.from("customers").select("*");

  if (search) query = query.or(`customer_name.ilike.%${search}%,company_name.ilike.%${search}%`);
  if (tm_id !== "all") query = query.eq("tm_id", tm_id);
  if (status !== "all") query = query.eq("status", status);

  const { data, error } = await query.order("receipt_date", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { data, error } = await supabase.from("customers").insert([body]).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data[0]);
}