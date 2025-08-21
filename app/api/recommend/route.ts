import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";
import OpenAI from "openai";

// Rule-based recommender using existing DB + popularity
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const age = Number(searchParams.get("age") ?? "0") || undefined;
    const limit = Number(searchParams.get("limit") ?? "10") || 10;
    const topic = (searchParams.get("topic") || "").trim();

    // If topic provided and OpenAI key exists, do web-aware search and LLM ranking
    if (topic && process.env.OPENAI_API_KEY) {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      // Use Open Library search API as public source
      const q = encodeURIComponent(topic);
      const resp = await fetch(`https://openlibrary.org/search.json?q=${q}&language=kor|eng&limit=25`, {
        headers: { "User-Agent": "maehwa-book/1.0" }
      });
      const json = await resp.json();
      const candidates = (json.docs || []).map((d: any) => ({
        title: d.title,
        author: (d.author_name && d.author_name[0]) || "",
        year: d.first_publish_year || null
      }));

      const prompt = `유치원생(3-7세)을 위한 책 추천. 주제: "${topic}". 아래 후보 중에서 ${limit}권을 한국어로 추천 순서대로 나열하고, 각 항목에 간단한 추천 이유(한 문장)를 붙이세요. 출력은 JSON 배열로 하고, 각 항목은 {title, author, reason} 키만 사용하세요. 후보 목록: ${JSON.stringify(candidates).slice(0, 5000)}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4.1-nano",
        messages: [
          { role: "system", content: "당신은 유아용 도서 큐레이터입니다. 한국어로 간결하게 JSON만 출력하세요." },
          { role: "user", content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 500
      });
      const content = completion.choices?.[0]?.message?.content || "[]";
      try {
        const parsed = JSON.parse(content);
        return NextResponse.json(parsed.slice(0, limit));
      } catch {
        return NextResponse.json(candidates.slice(0, limit));
      }
    }

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

