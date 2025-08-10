import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";

// GET /api/readings?page=1&pageSize=10&readerName=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") ?? "1") || 1;
    const pageSize = Number(searchParams.get("pageSize") ?? "10") || 10;
    const readerName = searchParams.get("readerName") ?? undefined;

    let query = supabase
      .from('readings')
      .select(`
        *,
        book:books(*),
        reader:readers(*)
      `)
      .order('read_date', { ascending: false });

    if (readerName) {
      query = query.eq('reader.name', readerName);
    }

    // 페이지네이션을 위한 카운트
    let countQuery = supabase
      .from('readings')
      .select('*', { count: 'exact', head: true });

    if (readerName) {
      countQuery = countQuery.eq('reader.name', readerName);
    }

    // 데이터와 카운트를 병렬로 가져오기
    const [{ data: items, error: itemsError }, { count: total, error: countError }] = await Promise.all([
      query.range((page - 1) * pageSize, page * pageSize - 1),
      countQuery
    ]);

    if (itemsError) throw itemsError;
    if (countError) throw countError;

    return NextResponse.json({ total: total || 0, page, pageSize, items: items || [] });
  } catch (e) {
    console.error("/api/readings GET error", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

// POST /api/readings
// body: { readDate, title, author, readerName, notes }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { readDate, title, author, readerName, notes } = body ?? {};
    if (!title || !author || !readDate)
      return NextResponse.json({ error: "title, author, readDate required" }, { status: 400 });

    // 1. 책 생성/조회
    let book;
    const { data: existingBook } = await supabase
      .from('books')
      .select('*')
      .eq('title', title)
      .eq('author', author)
      .single();

    if (existingBook) {
      book = existingBook;
    } else {
      const { data: newBook, error: bookError } = await supabase
        .from('books')
        .insert({ title, author })
        .select()
        .single();

      if (bookError) throw bookError;
      book = newBook;
    }

    // 2. 리더 생성/조회 (선택사항)
    let reader = null;
    if (readerName) {
      const { data: existingReader } = await supabase
        .from('readers')
        .select('*')
        .eq('name', readerName)
        .single();

      if (existingReader) {
        reader = existingReader;
      } else {
        const { data: newReader, error: readerError } = await supabase
          .from('readers')
          .insert({ name: readerName })
          .select()
          .single();

        if (readerError) throw readerError;
        reader = newReader;
      }
    }

    // 3. 읽기 기록 생성
    const { data: reading, error: readingError } = await supabase
      .from('readings')
      .insert({
        read_date: new Date(readDate).toISOString(),
        notes: notes ?? null,
        book_id: book.id,
        reader_id: reader?.id ?? null,
      })
      .select()
      .single();

    if (readingError) throw readingError;

    return NextResponse.json(reading, { status: 201 });
  } catch (e) {
    console.error("/api/readings POST error", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}