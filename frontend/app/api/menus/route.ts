import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const roleId = searchParams.get("role_id");

  if (!roleId || roleId === "undefined") return NextResponse.json([]);

  try {
    // 1. role_menu_access 테이블에서 해당 역할이 가진 menu_id 목록만 먼저 가져옵니다.
    const { data: accessData, error: accessError } = await supabase
      .from("role_menu_access")
      .select("menu_id")
      .eq("role_id", roleId);

    if (accessError) throw accessError;
    if (!accessData || accessData.length === 0) return NextResponse.json([]);

    // 2. 추출한 menu_id 배열을 만듭니다.
    const menuIds = accessData.map(item => item.menu_id);

    // 3. menus 테이블에서 해당 ID들에 포함된 메뉴 정보를 가져옵니다.
    const { data: menus, error: menuError } = await supabase
      .from("menus")
      .select("*")
      .in("id", menuIds)
      .order("sort_order", { ascending: true });

    if (menuError) throw menuError;

    return NextResponse.json(menus);
  } catch (error: any) {
    console.error("Menu Fetch Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}