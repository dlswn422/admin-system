import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Supabase 클라이언트 초기화
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * 1. 개별 고객 정보 수정 (PATCH)
 * URL: /api/customers/[id]
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Next.js 15 규칙: params를 await로 가져와야 합니다.
    const { id } = await params; 
    const body = await request.json();

    if (!id) {
      return NextResponse.json({ error: "ID가 유효하지 않습니다." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("customers")
      .update(body)
      .eq("id", id)
      .select();

    if (error) {
      console.error("Supabase Update Error:", error);
      throw error;
    }

    // 수정된 데이터 반환
    return NextResponse.json(data[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * 2. 개별 고객 삭제 (DELETE)
 * URL: /api/customers/[id]
 * 🌟 휴지통 버튼 클릭 시 호출되는 함수입니다.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Next.js 15 규칙: params를 await로 가져와야 합니다.
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "ID가 누락되었습니다." }, { status: 400 });
    }

    const { error } = await supabase
      .from("customers")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Supabase Delete Error:", error);
      throw error;
    }

    /**
     * 🌟 [핵심] JSON 파싱 에러 방지
     * 삭제 후 빈 응답을 보내면 프론트엔드 res.json()에서 에러가 납니다.
     * 반드시 아래와 같이 JSON 객체를 응답해야 합니다.
     */
    return NextResponse.json({ 
      success: true, 
      message: "고객 정보가 정상적으로 삭제되었습니다." 
    });

  } catch (error: any) {
    console.error("API 개별 삭제 오류:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}