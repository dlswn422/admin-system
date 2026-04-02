import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File;
  const customer_id = formData.get("customer_id") as string;

  if (!file) return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });

  // 1. Supabase Storage 업로드
  const fileName = `${customer_id}/${Date.now()}_${file.name}`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("recordings")
    .upload(fileName, file);

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  // 2. 공용 URL 가져오기
  const { data: { publicUrl } } = supabase.storage.from("recordings").getPublicUrl(fileName);

  // 3. DB에 녹취 이력 저장
  const { error: dbError } = await supabase.from("customer_recordings").insert({
    customer_id,
    file_name: file.name,
    file_url: publicUrl
  });

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json({ url: publicUrl });
}