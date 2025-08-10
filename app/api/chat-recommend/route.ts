import { NextRequest } from "next/server";
import { supabase } from "@/app/lib/supabase";

// 간단 룰 기반 + 최근/인기 데이터로 답변 흉내. 실제 GPT 연동은 추후 .env API 키로 확장
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { message, age } = body ?? {};

  const top = await prisma.reading.groupBy({ by: ["bookId"], _count: { bookId: true }, orderBy: { _count: { bookId: "desc" } }, take: 5 });
  const ids = top.map((t) => t.bookId);
  const books = await prisma.book.findMany({ where: { id: { in: ids } } });
  const suggestions = books.map((b) => `"${b.title}" (${b.author})`).join(", ");

  const ageLine = age ? `${age}세에게 잘 맞는 도서를 찾아봤어요. ` : "";
  const reply = `${ageLine}${message ? `질문 "${message}"에 대한 추천입니다. ` : ""}요즘 인기가 많은 책은 ${suggestions} 입니다. 이 중에서 한 권을 골라 함께 읽어보는 건 어떨까요?`;

  return new Response(JSON.stringify({ reply }), { headers: { "Content-Type": "application/json" } });
}

