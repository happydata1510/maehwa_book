import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";

// GET /api/readers -> list readers
export async function GET() {
  try {
    const { data: readers, error } = await supabase
      .from('readers')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    return NextResponse.json(readers || []);
  } catch (e) {
    console.error("/api/readers GET error", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

// POST /api/readers -> upsert reader { name, className?, parentPhone? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, className, parentPhone, age } = body ?? {};
    if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

    // 먼저 기존 reader가 있는지 확인
    const { data: existingReader } = await supabase
      .from('readers')
      .select('*')
      .eq('name', name)
      .single();

    let reader;
    if (existingReader) {
      // 기존 reader 업데이트
      const { data: updatedReader, error } = await supabase
        .from('readers')
        .update({ 
          class_name: className ?? null, 
          parent_phone: parentPhone ?? null, 
          age: age ?? null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingReader.id)
        .select()
        .single();

      if (error) throw error;
      reader = updatedReader;
    } else {
      // 새 reader 생성
      const { data: newReader, error } = await supabase
        .from('readers')
        .insert({
          name,
          class_name: className ?? null,
          parent_phone: parentPhone ?? null,
          age: age ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      reader = newReader;
    }

    return NextResponse.json({ ok: true, reader, message: "등록되었습니다." }, { status: 201 });
  } catch (e) {
    console.error("/api/readers POST error", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}