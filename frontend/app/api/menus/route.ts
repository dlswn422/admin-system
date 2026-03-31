import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roleId = searchParams.get("role_id");
    const isAll = searchParams.get("all") === "true"; // 전체 조회 여부 파라미터 확인

    // --- CASE 1. [전체 조회 모드] 메뉴 관리 / 역할 관리 화면용 ---
    // 파라미터에 all=true가 붙어오면 권한 체크 없이 모든 메뉴를 반환합니다.
    if (isAll) {
      const { data: allMenus, error: allMenuError } = await supabase
        .from("menus")
        .select("*")
        .order("sort_order", { ascending: true });

      if (allMenuError) throw allMenuError;
      return NextResponse.json(allMenus);
    }

    // --- CASE 2. [권한 기반 조회 모드] 사이드바 등 로그인 유저 전용 ---
    // role_id가 없거나 'undefined' 문자열로 들어오면 보안을 위해 빈 배열을 반환합니다.
    if (!roleId || roleId === "undefined") {
      return NextResponse.json([]);
    }

    // 2-1. 해당 역할(role_id)이 접근 가능한 menu_id 목록을 가져옵니다.
    const { data: accessData, error: accessError } = await supabase
      .from("role_menu_access")
      .select("menu_id")
      .eq("role_id", roleId);

    if (accessError) throw accessError;

    // 할당된 메뉴가 하나도 없다면 빈 배열 반환
    if (!accessData || accessData.length === 0) {
      return NextResponse.json([]);
    }

    // menu_id들만 배열로 추출 (['uuid1', 'uuid2', ...])
    const menuIds = accessData.map((item: any) => item.menu_id);

    // 2-2. 추출된 menu_id들에 해당하는 실제 메뉴 정보들을 조회합니다.
    const { data: menus, error: menuError } = await supabase
      .from("menus")
      .select("*")
      .in("id", menuIds)
      .order("sort_order", { ascending: true });

    if (menuError) throw menuError;

    return NextResponse.json(menus);

  } catch (error: any) {
    console.error("Critical Menu Fetch Error:", error.message);
    return NextResponse.json(
      { error: "메뉴 데이터를 불러오는 중 서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}