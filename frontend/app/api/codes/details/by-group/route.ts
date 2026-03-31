import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const groupCode = searchParams.get("group_code");

  if (!groupCode) {
    return NextResponse.json({ error: "group_code is required" }, { status: 400 });
  }

  try {
    // 1. group_code로 group_id를 먼저 찾습니다.
    const { data: groupData, error: groupError } = await supabase
      .from("code_groups")
      .select("id")
      .eq("group_code", groupCode)
      .single();

    if (groupError || !groupData) throw new Error("Group not found");

    // 2. 찾은 group_id로 속한 모든 상세 코드를 가져옵니다.
    const { data: details, error: detailError } = await supabase
      .from("code_details")
      .select("code_value, code_name, sort_order")
      .eq("group_id", groupData.id)
      .eq("is_use", true) // 사용 중인 것만
      .order("sort_order", { ascending: true });

    if (detailError) throw detailError;

    return NextResponse.json(details);
  } catch (error: any) {
    console.error("Common Code Fetch Error:", error.message);
    return NextResponse.json([], { status: 200 }); // 에러 시 빈 배열 반환하여 렌더링 방해 방지
  }
}