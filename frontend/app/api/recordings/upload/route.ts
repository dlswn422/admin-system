import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const BUCKET_NAME = "recordings";

function extractStoragePathFromPublicUrl(fileUrl: string) {
  try {
    const marker = `/storage/v1/object/public/${BUCKET_NAME}/`;
    const index = fileUrl.indexOf(marker);

    if (index === -1) return null;

    return decodeURIComponent(fileUrl.substring(index + marker.length));
  } catch {
    return null;
  }
}

// 1. 특정 고객의 녹취 목록 가져오기
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const customer_id = searchParams.get("customer_id");

    if (!customer_id) {
      return NextResponse.json(
        { error: "고객 ID가 없습니다." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("customer_recordings")
      .select("*")
      .eq("customer_id", customer_id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "녹취 목록 조회 실패" },
      { status: 500 }
    );
  }
}

// 2. 녹취 파일 업로드
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const customerId = formData.get("customer_id") as string | null;
    const createdBy = formData.get("created_by") as string | null;

    if (!file || !customerId) {
      return NextResponse.json(
        { error: "파일 또는 고객 ID 누락" },
        { status: 400 }
      );
    }

    const safeFileName = file.name.replace(/[^\w.\-가-힣]/g, "_");
    const filePath = `${customerId}/${Date.now()}_${safeFileName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

    const payload: Record<string, any> = {
      customer_id: customerId,
      file_name: file.name,
      file_url: publicUrl,
      duration: null,
    };

    if (createdBy) {
      payload.created_by = createdBy;
    }

    const { data, error: dbError } = await supabase
      .from("customer_recordings")
      .insert([payload])
      .select()
      .single();

    if (dbError) {
      throw dbError;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "녹취 업로드 실패" },
      { status: 500 }
    );
  }
}

// 3. 녹취 삭제
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const recordingId = body?.id as string | undefined;

    if (!recordingId) {
      return NextResponse.json(
        { error: "녹취 ID가 없습니다." },
        { status: 400 }
      );
    }

    const { data: recording, error: findError } = await supabase
      .from("customer_recordings")
      .select("id, file_url")
      .eq("id", recordingId)
      .single();

    if (findError || !recording) {
      return NextResponse.json(
        { error: "녹취 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const storagePath = extractStoragePathFromPublicUrl(recording.file_url);

    if (storagePath) {
      const { error: storageError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([storagePath]);

      if (storageError) {
        return NextResponse.json(
          { error: storageError.message },
          { status: 500 }
        );
      }
    }

    const { error: deleteError } = await supabase
      .from("customer_recordings")
      .delete()
      .eq("id", recordingId);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "녹취 파일이 삭제되었습니다.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "녹취 삭제 실패" },
      { status: 500 }
    );
  }
}