import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * 1. 고객 목록 조회 (GET)
 * 페이징(limit/offset) 및 다중 필터 완벽 대응
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 파라미터 추출
    const search = searchParams.get("search") || "";
    const tm_id = searchParams.get("tm_id") || "all";
    const sales_id = searchParams.get("sales_id") || "all";
    const consult_status = searchParams.get("consult_status") || "all";
    const sales_status = searchParams.get("sales_status") || "all";
    const date_type = searchParams.get("date_type") || "접수일";
    const date_from = searchParams.get("date_from") || "";
    const date_to = searchParams.get("date_to") || "";
    
    // 🌟 서버 사이드 페이징 파라미터 (기본값 설정)
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");

    // count: "exact"를 설정해야 전체 레코드 개수를 가져와서 페이지네이션 계산이 가능합니다.
    let query = supabase.from("customers").select("*", { count: "exact" });

    // 통합 검색 (업체명, 고객명, 휴대폰)
    if (search) {
      query = query.or(`customer_name.ilike.%${search}%,company_name.ilike.%${search}%,mobile_phone.ilike.%${search}%`);
    }

    // 담당 TM 필터
    if (tm_id === "unassigned") {
      query = query.is("tm_id", null);
    } else if (tm_id === "assigned") {
      query = query.not("tm_id", "is", null);
    } else if (tm_id !== "all" && tm_id !== "") {
      query = query.eq("tm_id", tm_id);
    }

    // 영업 담당 필터
    if (sales_id === "unassigned") {
      query = query.is("sales_id", null);
    } else if (sales_id === "assigned") {
      query = query.not("sales_id", "is", null);
    } else if (sales_id !== "all" && sales_id !== "") {
      query = query.eq("sales_id", sales_id);
    }

    // 상담 및 영업 상태 필터
    if (consult_status !== "all" && consult_status !== "") {
      query = query.eq("consult_status", consult_status);
    }
    if (sales_status !== "all" && sales_status !== "") {
      query = query.eq("sales_status", sales_status);
    }

    // 기간 필터 (접수일 vs 상담일 구분)
    const dateColumn = date_type === "상담일" ? "consult_date" : "receipt_date";
    if (date_from) query = query.gte(dateColumn, date_from);
    if (date_to) query = query.lte(dateColumn, date_to);

    // 🌟 정렬 및 페이징 범위 적용
    const { data, error, count } = await query
      .order(dateColumn, { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // 🌟 중요: 프론트엔드가 페이징 처리를 할 수 있도록 데이터와 전체 개수를 객체로 반환
    return NextResponse.json({ 
      data: data || [], 
      totalCount: count || 0 
    });

  } catch (error: any) {
    console.error("고객 조회 오류:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * 2. 신규 고객 등록 (POST)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = {
      ...body,
      consult_status: body.consult_status && body.consult_status.trim() !== "" 
                      ? body.consult_status 
                      : "대기"
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
 * 4. 일괄 삭제 (DELETE)
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