import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month"); // format YYYY-MM
    const readerName = searchParams.get("readerName") ?? undefined;

    // 기본 쿼리 빌더
    let countQuery = supabase.from('readings').select('*', { count: 'exact', head: true });
    let booksQuery = supabase.from('readings').select(`
      book_id,
      book:books(*)
    `);

    // 날짜 필터
    if (month) {
      const start = new Date(`${month}-01T00:00:00Z`);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      const startStr = start.toISOString();
      const endStr = end.toISOString();
      countQuery = countQuery.gte('read_date', startStr).lt('read_date', endStr);
      booksQuery = booksQuery.gte('read_date', startStr).lt('read_date', endStr);
    }

    // 리더 필터
    if (readerName) {
      const { data: reader } = await supabase
        .from('readers')
        .select('id')
        .eq('name', readerName)
        .single();
      
      if (reader) {
        countQuery = countQuery.eq('reader_id', reader.id);
        booksQuery = booksQuery.eq('reader_id', reader.id);
      } else {
        return NextResponse.json({ total: 0, topBooks: [] });
      }
    }

    // 전체 개수 가져오기
    const { count: total } = await countQuery;

    // 인기 책 통계 가져오기
    const { data: allReadings } = await booksQuery;
    
    // 책별 읽기 횟수 계산
    const bookCounts = new Map();
    (allReadings || []).forEach(reading => {
      const bookId = reading.book_id;
      bookCounts.set(bookId, (bookCounts.get(bookId) || 0) + 1);
    });

    // 상위 10개 책 추출
    const topBookEntries = Array.from(bookCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    // 책 정보와 함께 결과 구성
    const topBooks = topBookEntries.map(([bookId, count]) => {
      const reading = (allReadings || []).find(r => r.book_id === bookId);
      return {
        count,
        book: reading?.book || null
      };
    }).filter(item => item.book);

    return NextResponse.json({ total: total || 0, topBooks });
  } catch (e) {
    console.error("/api/stats GET error", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

