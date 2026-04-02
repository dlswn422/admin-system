import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 1. 개별 고객 정보 수정 ( PATCH )
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Promise 타입으로 명시
) {
  try {
    // 💡 Next.js 15 필수: params를 await로 기다려야 합니다.
    const { id } = await params; 
    const body = await request.json();

    const { data, error } = await supabase
      .from("customers")
      .update(body)
      .eq("id", id)
      .select();

    if (error) throw error;
    return NextResponse.json(data[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 2. 개별 고객 삭제 ( DELETE )
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Promise 타입으로 명시
) {
  try {
    // 💡 에러 발생 지점 수정: await params 추가
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

    return NextResponse.json({ success: true, message: "고객 정보가 삭제되었습니다." });
  } catch (error: any) {
    console.error("API DELETE Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}