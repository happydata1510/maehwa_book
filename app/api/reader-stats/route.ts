import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";

// GET /api/reader-stats?readerName=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const readerName = searchParams.get("readerName") ?? undefined;

    if (!readerName) {
      return NextResponse.json({
        count: 0,
        latestTitle: null,
        latestDate: null,
      });
    }

    // 1. 해당 이름의 reader 찾기
    const { data: reader } = await supabase
      .from('readers')
      .select('id')
      .eq('name', readerName)
      .single();

    if (!reader) {
      return NextResponse.json({
        count: 0,
        latestTitle: null,
        latestDate: null,
      });
    }

    // 2. 읽기 횟수 카운트
    const { count, error: countError } = await supabase
      .from('readings')
      .select('*', { count: 'exact', head: true })
      .eq('reader_id', reader.id);

    if (countError) throw countError;

    // 3. 최신 읽기 기록 가져오기
    const { data: latest, error: latestError } = await supabase
      .from('readings')
      .select(`
        read_date,
        book:books(title)
      `)
      .eq('reader_id', reader.id)
      .order('read_date', { ascending: false })
      .limit(1)
      .single();

    if (latestError && latestError.code !== 'PGRST116') throw latestError; // PGRST116 = no rows

    return NextResponse.json({
      count: count || 0,
      latestTitle: (latest?.book as any)?.title ?? null,
      latestDate: latest?.read_date ?? null,
    });
  } catch (e) {
    console.error("/api/reader-stats GET error", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}