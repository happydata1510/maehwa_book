import { NextRequest } from "next/server";
import { supabase } from "@/app/lib/supabase";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Google Gemini API를 사용한 개인화된 책 추천
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, age, readerName } = body ?? {};

    // 사용자의 읽기 기록 가져오기
    let readingHistory = "";
    if (readerName) {
      const { data: readerData } = await supabase
        .from('readers')
        .select('id')
        .eq('name', readerName)
        .single();

      if (readerData) {
        const { data: readings } = await supabase
          .from('readings')
          .select(`
            book:books(title, author)
          `)
          .eq('reader_id', readerData.id)
          .order('read_date', { ascending: false })
          .limit(10);

        if (readings && readings.length > 0) {
          readingHistory = readings
            .map(r => `"${(r.book as any)?.title}" by ${(r.book as any)?.author}`)
            .join(', ');
        }
      }
    }

    // 전체 인기 책 가져오기
    const { data: popularReadings } = await supabase
      .from('readings')
      .select(`
        book_id,
        book:books(title, author)
      `)
      .limit(100);

    let popularBooks = "";
    if (popularReadings && popularReadings.length > 0) {
      const bookCounts: { [key: number]: { count: number; book: any } } = {};
      popularReadings.forEach(reading => {
        if (reading.book_id && reading.book) {
          if (!bookCounts[reading.book_id]) {
            bookCounts[reading.book_id] = { count: 0, book: reading.book };
          }
          bookCounts[reading.book_id].count++;
        }
      });

      const topBooks = Object.values(bookCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map(item => item.book);

      popularBooks = topBooks
        .map((book: any) => `"${book.title}" by ${book.author}`)
        .join(', ');
    }

    // Google Gemini API 키가 없을 때 대체 응답
    if (!process.env.GEMINI_API_KEY) {
      let reply = "";
      
      // 책 추천 요청 시 더 상세한 질문으로 유도
      if (message.includes("추천")) {
        reply = `${readerName ? `${readerName}에게` : '아이에게'} 맞는 책을 추천해드리고 싶어요! 더 정확한 추천을 위해 알려주세요:\n\n1. 현재 어떤 주제에 관심이 있나요? (동물, 공주, 자동차, 과학 등)\n2. 최근에 읽은 책과 비슷한 책을 원하시나요, 아니면 새로운 분야의 책을 원하시나요?\n\n이런 정보가 있으면 더 좋은 추천을 해드릴 수 있어요! 🌸`;
      } else if (message.includes("안녕") || message.includes("반가")) {
        reply = `안녕하세요! 매화유치원 AI 책 추천 도우미입니다. ${readerName ? `${readerName}에게` : '아이에게'} 딱 맞는 책을 찾아드릴게요! 📚✨`;
      } else {
        reply = "책 추천에 관련된 질문을 해주시면 도움을 드릴 수 있어요! '책 추천해줘'라고 말씀해보세요! 🌸";
      }

      return new Response(JSON.stringify({ reply }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Google Gemini 클라이언트 초기화
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 책 추천 시 상세 질문으로 유도하는 로직
    const isRecommendationRequest = message.includes("추천");
    
    let prompt = "";
    
    if (isRecommendationRequest && !message.includes("관심") && !message.includes("비슷") && !message.includes("새로운")) {
      // 단순 추천 요청 시 더 자세한 정보를 요청
      prompt = `당신은 매화유치원의 친근한 책 추천 도우미입니다. 
${readerName ? `${readerName} (${age}세)` : `${age}세 아이`}에게 더 정확한 책 추천을 위해 다음을 물어보세요:

1. 현재 아이가 관심있어하는 주제는? (동물, 공주, 자동차, 공룡, 과학 등)
2. 읽었던 책들을 기반으로 추천하기 원하는지? 새로운 책을 원하는지?

따뜻하고 친근한 톤으로 한국어로 200자 이내로 답변해주세요.`;
    } else {
      // 상세 정보가 포함된 요청이거나 일반 대화
      prompt = `당신은 매화유치원의 친근한 책 추천 도우미입니다. 
한국어로 답변하고, 유치원생(3-7세)에게 적합한 책을 추천해주세요.
답변은 250자 이내로 간결하고 친근하게 해주세요.

현재 정보:
- 아이 나이: ${age || '알 수 없음'}세
- 아이 이름: ${readerName || '알 수 없음'}
${readingHistory ? `- ${readerName}의 최근 읽은 책: ${readingHistory}` : ''}
${popularBooks ? `- 유치원에서 인기 있는 책들: ${popularBooks}` : ''}

사용자 메시지: "${message}"

답변할 때 다음을 고려해주세요:
1. 아이의 나이와 읽기 기록을 고려한 개인화된 추천
2. 따뜻하고 격려하는 톤
3. 구체적인 책 제목과 간단한 이유 제시
4. 독서의 즐거움 강조`;
    }

    // Gemini API 호출
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const reply = response.text() || "죄송해요, 지금은 답변을 드리기 어려워요. 나중에 다시 시도해주세요.";

    return new Response(JSON.stringify({ reply }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Gemini API error:", error);
    
    // 에러 시 대체 응답
    const fallbackReply = "죄송해요, 지금은 AI 시스템에 문제가 있어서 답변을 드리기 어려워요. 잠시 후 다시 시도해주세요! 📚";
    
    return new Response(JSON.stringify({ reply: fallbackReply }), {
      headers: { "Content-Type": "application/json" },
    });
  }
}