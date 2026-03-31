import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const { name, password } = await request.json();

    // 1. 유저 정보 및 역할(Role) 정보 Join 조회
    // 💡 role_id를 가져오는 것은 물론, roles 테이블과 조인하여 역할 이름도 함께 가져옵니다.
    const { data: user, error } = await supabase
      .from("users")
      .select(`
        id, 
        name, 
        password_hash,
        role_id,
        roles (
          name
        )
      `)
      .eq("name", name.trim())
      .maybeSingle();

    // 사용자가 존재하지 않거나 DB 에러 발생 시
    if (error || !user) {
      return NextResponse.json(
        { error: "등록되지 않은 관리자 계정입니다." },
        { status: 401 }
      );
    }

    // 2. 비밀번호 체크 (일반 텍스트 비교 방식 유지)
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
        name: user.name,
        role_id: user.role_id,
        // 💡 아래와 같이 수정: 배열인지 체크하거나 타입을 강제 지정합니다.
        role_name: Array.isArray(user.roles) 
          ? user.roles[0]?.name 
          : (user.roles as any)?.name || "권한 미정"
      }
    });

  } catch (err) {
    console.error("Server Error:", err);
    return NextResponse.json({ error: "시스템 통신 중 오류가 발생했습니다." }, { status: 500 });
  }
}