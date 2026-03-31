import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const { name, password } = await request.json();

    // 1. 유저 정보 조회
    // 💡 roles(name) 대신 단순 조회를 먼저 시도하거나, 정확한 관계명을 명시해야 합니다.
    const { data: user, error } = await supabase
      .from("users")
      .select(`
        id, 
        name, 
        password_hash,
        role_id
      `)
      .eq("name", name.trim()) // 공백 제거 추가
      .maybeSingle(); // 데이터가 없어도 에러 대신 null 반환

    // 데이터가 아예 없는 경우
    if (error || !user) {
      console.error("Supabase Error or No User:", error);
      return NextResponse.json(
        { error: "등록되지 않은 이름입니다." },
        { status: 401 }
      );
    }

    // 2. 비밀번호 체크 (DB의 password_hash와 입력값 비교)
    if (user.password_hash !== password) {
      return NextResponse.json(
        { error: "비밀번호가 일치하지 않습니다." },
        { status: 401 }
      );
    }

    // 3. 로그인 성공 응답
    return NextResponse.json({
      success: true,
      user: { 
        id: user.id, 
        name: user.name 
      }
    });

  } catch (err) {
    console.error("Server Error:", err);
    return NextResponse.json({ error: "서버 오류 발생" }, { status: 500 });
  }
}