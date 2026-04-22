import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * 1. 고객 목록 조회 (검색 및 배정/미배정 필터 대응)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const tm_id = searchParams.get("tm_id") || "all";
    const sales_id = searchParams.get("sales_id") || "all";
    const consult_status = searchParams.get("consult_status") || "all";
    const sales_status = searchParams.get("sales_status") || "all";

    let query = supabase.from("customers").select("*");

    if (search) {
      query = query.or(`customer_name.ilike.%${search}%,company_name.ilike.%${search}%,mobile_phone.ilike.%${search}%`);
    }

    if (tm_id === "unassigned") {
      query = query.is("tm_id", null);
    } else if (tm_id === "assigned") {
      query = query.not("tm_id", "is", null);
    } else if (tm_id !== "all") {
      query = query.eq("tm_id", tm_id);
    }

    if (sales_id === "unassigned") {
      query = query.is("sales_id", null);
    } else if (sales_id === "assigned") {
      query = query.not("sales_id", "is", null);
    } else if (sales_id !== "all") {
      query = query.eq("sales_id", sales_id);
    }

    if (consult_status !== "all") query = query.eq("consult_status", consult_status);
    if (sales_status !== "all") query = query.eq("sales_status", sales_status);

    const { data, error } = await query.order("receipt_date", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * 2. 신규 고객 등록
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = {
      ...body,
      consult_status: body.consult_status && body.consult_status.trim() !== "" ? body.consult_status : "대기"
    };
    const { data, error } = await supabase.from("customers").insert([payload]).select();
    if (error) throw error;
    return NextResponse.json(data[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * 3. 일괄 담당자 배정 (PATCH)
 */
export async function PATCH(request: Request) {
  try {
    const { ids, type, assignee_id } = await request.json();
    const column = type === 'TM' ? 'tm_id' : 'sales_id';

    if (!ids || ids.length === 0) {
      return NextResponse.json({ error: "선택된 고객이 없습니다." }, { status: 400 });
    }

    const updateValue = assignee_id === "" || assignee_id === "all" || assignee_id === "unassigned" ? null : assignee_id;

    const { error } = await supabase.from("customers").update({ [column]: updateValue }).in("id", ids);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * 🌟 4. 일괄 삭제 (DELETE)
 * URL: /api/customers 요청을 처리 (Body에 ids 배열 필요)
 */
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "삭제할 고객 정보가 선택되지 않았습니다." }, { status: 400 });
    }

    const { error } = await supabase.from("customers").delete().in("id", ids);
    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      message: `${ids.length}건의 고객 정보가 삭제되었습니다.` 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}