import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";

// Rule-based recommender using existing DB + popularity
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const age = Number(searchParams.get("age") ?? "0") || undefined;
    const limit = Number(searchParams.get("limit") ?? "10") || 10;

    // 먼저 읽기 기록에서 인기 있는 책들을 찾기
    const { data: popularReadings } = await supabase
      .from('readings')
      .select(`
        book_id,
        book:books(*)
      `);

    // 책별 읽기 횟수 계산
    const bookCounts = new Map();
    (popularReadings || []).forEach(reading => {
      const book = reading.book as any;
      if (book && (!age || !book.age_min || book.age_min <= age) && (!age || !book.age_max || book.age_max >= age)) {
        const bookId = reading.book_id;
        bookCounts.set(bookId, (bookCounts.get(bookId) || 0) + 1);
      }
    });

    // 인기순으로 정렬하여 상위 책들 추출
    const topBooks = Array.from(bookCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([bookId]) => {
        const reading = (popularReadings || []).find(r => r.book_id === bookId);
        return reading?.book;
      })
      .filter(Boolean);

    // 인기 책이 부족하면 나이에 맞는 다른 책들로 보완
    if (topBooks.length < limit) {
      let query = supabase.from('books').select('*');
      
      if (age) {
        query = query.or(`age_min.is.null,age_min.lte.${age}`).or(`age_max.is.null,age_max.gte.${age}`);
      }
      
      const { data: additionalBooks } = await query
        .order('title', { ascending: true })
        .limit(limit * 2);

      // 이미 선택된 책 제외하고 추가
      const existingIds = new Set(topBooks.map((book: any) => book?.id).filter(Boolean));
      const newBooks = (additionalBooks || []).filter(book => !existingIds.has(book.id));
      
      topBooks.push(...newBooks.slice(0, limit - topBooks.length));
    }

    return NextResponse.json(topBooks.slice(0, limit));
  } catch (e) {
    console.error("/api/recommend GET error", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

