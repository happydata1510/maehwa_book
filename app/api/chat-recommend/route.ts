import { NextRequest } from "next/server";
import { supabase } from "@/app/lib/supabase";

// 간단 룰 기반 + 최근/인기 데이터로 답변 흉내. 실제 GPT 연동은 추후 .env API 키로 확장
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { message, age } = body ?? {};

  try {
    // 가장 많이 읽힌 책들 조회 (Supabase에서는 직접 SQL을 사용하거나 RPC 함수 필요)
    const { data: topReadings, error } = await supabase
      .from('readings')
      .select(`
        book_id,
        book:books(title, author)
      `)
      .limit(100); // 충분한 수의 기록을 가져와서 클라이언트에서 집계

    if (error) throw error;

    // 클라이언트에서 책별로 카운트 집계
    const bookCounts: { [key: number]: { count: number; book: any } } = {};
    topReadings?.forEach(reading => {
      if (reading.book_id && reading.book) {
        if (!bookCounts[reading.book_id]) {
          bookCounts[reading.book_id] = { count: 0, book: reading.book };
        }
        bookCounts[reading.book_id].count++;
      }
    });

    // 카운트 순으로 정렬하여 상위 5개 선택
    const topBooks = Object.values(bookCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(item => item.book);

    const suggestions = topBooks.length > 0 
      ? topBooks.map((b) => `"${b.title}" (${b.author})`).join(", ")
      : "새로운 책들";

    const ageLine = age ? `${age}세에게 잘 맞는 도서를 찾아봤어요. ` : "";
    const reply = `${ageLine}${message ? `질문 "${message}"에 대한 추천입니다. ` : ""}요즘 인기가 많은 책은 ${suggestions} 입니다. 이 중에서 한 권을 골라 함께 읽어보는 건 어떨까요?`;

    return new Response(JSON.stringify({ reply }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    console.error("Chat recommend error:", e);
    const fallbackReply = "죄송합니다. 추천 시스템에 일시적인 문제가 있습니다. 다양한 그림책을 함께 읽어보세요!";
    return new Response(JSON.stringify({ reply: fallbackReply }), { headers: { "Content-Type": "application/json" } });
  }
}