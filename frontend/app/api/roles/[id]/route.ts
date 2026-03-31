import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 1. 역할 정보 및 메뉴 권한 수정 (PATCH)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, menu_ids } = body; // menu_ids: ["uuid1", "uuid2", ...]

    if (!id || id === "undefined") {
      return NextResponse.json({ error: "유효한 ID가 필요합니다." }, { status: 400 });
    }

    // --- 트랜잭션 방식이 지원되지 않으므로 순차적으로 처리 ---

    // [Step 1] 역할 이름(name) 업데이트
    const { error: roleError } = await supabase
      .from("roles")
      .update({ name })
      .eq("id", id);

    if (roleError) throw roleError;

    // [Step 2] 기존 메뉴 권한(role_menu_access) 삭제
    const { error: deleteError } = await supabase
      .from("role_menu_access")
      .delete()
      .eq("role_id", id);

    if (deleteError) throw deleteError;

    // [Step 3] 새로운 메뉴 권한들(menu_ids) 입력
    if (menu_ids && menu_ids.length > 0) {
      const inserts = menu_ids.map((mId: string) => ({
        role_id: id,
        menu_id: mId
      }));

      const { error: insertError } = await supabase
        .from("role_menu_access")
        .insert(inserts);

      if (insertError) throw insertError;
    }

    return NextResponse.json({ message: "역할 및 권한 수정 완료" });

  } catch (error: any) {
    console.error("PATCH Roles Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 2. 역할 삭제 (DELETE)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || id === "undefined") {
      return NextResponse.json({ error: "유효한 ID가 필요합니다." }, { status: 400 });
    }

    // 외래키 제약 조건(ON DELETE CASCADE)이 걸려있다면 role_menu_access도 자동 삭제됩니다.
    const { error } = await supabase
      .from("roles")
      .delete()
      .eq("id", id);

    if (error) {
      // 유저가 이 역할을 참조하고 있는 경우 에러가 발생함
      return NextResponse.json({ 
        error: "이 역할을 사용 중인 사용자가 있어 삭제할 수 없습니다. 사용자 정보를 먼저 변경하세요." 
      }, { status: 400 });
    }

    return NextResponse.json({ message: "삭제 성공" });

  } catch (error: any) {
    console.error("DELETE Role Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}