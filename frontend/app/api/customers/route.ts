import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 1. 고객 목록 조회 (검색 및 배정/미배정 필터 완벽 대응)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const tm_id = searchParams.get("tm_id") || "all";
    const sales_id = searchParams.get("sales_id") || "all";
    const consult_status = searchParams.get("consult_status") || "all";
    const sales_status = searchParams.get("sales_status") || "all";

    let query = supabase.from("customers").select("*");

    // 통합 검색 (업체명, 대표자명, 휴대폰)
    if (search) {
      query = query.or(`customer_name.ilike.%${search}%,company_name.ilike.%${search}%,mobile_phone.ilike.%${search}%`);
    }

    /**
     * 상세 필터링 로직 (UUID 타입 에러 방지 및 조건 확장)
     */

    // 1-1. 담당 TM 필터
    if (tm_id === "unassigned") {
      query = query.is("tm_id", null);           // 미배정 (NULL인 데이터)
    } else if (tm_id === "assigned") {
      query = query.not("tm_id", "is", null);    // 배정 완료 (NULL이 아닌 데이터)
    } else if (tm_id !== "all") {
      query = query.eq("tm_id", tm_id);          // 특정 담당자 (UUID)
    }

    // 1-2. 영업 담당 필터
    if (sales_id === "unassigned") {
      query = query.is("sales_id", null);        // 미배정 (NULL인 데이터)
    } else if (sales_id === "assigned") {
      query = query.not("sales_id", "is", null); // 배정 완료 (NULL이 아닌 데이터)
    } else if (sales_id !== "all") {
      query = query.eq("sales_id", sales_id);    // 특정 담당자 (UUID)
    }

    // 1-3. 상태 필터
    if (consult_status !== "all") {
      query = query.eq("consult_status", consult_status);
    }
    if (sales_status !== "all") {
      query = query.eq("sales_status", sales_status);
    }

    // 최신 접수일 순 정렬
    const { data, error } = await query.order("receipt_date", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || []);

  } catch (error: any) {
    console.error("고객 조회 오류:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 2. 신규 고객 등록
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { data, error } = await supabase.from("customers").insert([body]).select();
    
    if (error) throw error;
    return NextResponse.json(data[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 3. 일괄 담당자 배정
export async function PATCH(request: Request) {
  try {
    const { ids, type, assignee_id } = await request.json();
    const column = type === 'TM' ? 'tm_id' : 'sales_id';

    if (!ids || ids.length === 0) {
      return NextResponse.json({ error: "선택된 고객이 없습니다." }, { status: 400 });
    }

    // 배정 시 값이 없거나 'all'인 경우 null로 처리하여 배정 해제 가능하도록 설정
    const updateValue = assignee_id === "" || assignee_id === "all" || assignee_id === "unassigned" ? null : assignee_id;

    const { error } = await supabase
      .from("customers")
      .update({ [column]: updateValue })
      .in("id", ids);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}