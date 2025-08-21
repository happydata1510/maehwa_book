import { NextRequest } from "next/server";
import { supabase } from "@/app/lib/supabase";
import OpenAI from "openai";

// OpenAI GPT-4.1-nano를 사용한 개인화된 책 추천
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, age, readerName, history } = body ?? {};
    const userMessage = (message || "").toString().trim();
    if (!userMessage) {
      return new Response(JSON.stringify({ reply: "어떤 책을 찾고 계신가요? 관심 주제나 상황을 알려주세요!" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

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

    // OpenAI API가 없으면 대체 응답
    if (!process.env.OPENAI_API_KEY) {
      let reply = "";
      
      const ageText = age ? `${age}세` : '유치원생';
      
      // 책 추천 요청 시 더 상세한 질문으로 유도
      if (/추천/.test(userMessage)) {
        reply = `${readerName ? `${readerName}(${ageText})에게` : `${ageText} 아이에게`} 맞는 동화책을 추천해드리고 싶어요! 더 정확한 추천을 위해 알려주세요:\n\n1. 현재 어떤 주제에 관심이 있나요? (동물, 공주, 자동차, 과학 등)\n2. 친구들이 읽었던 책을 원하시나요, 아니면 새로운 동화책을 원하시나요?\n\n이런 정보가 있으면 더 좋은 동화책 추천을 해드릴 수 있어요! 🌸`;
      } else if (/(안녕|반가)/.test(userMessage)) {
        reply = `안녕하세요! 매화유치원 동화책 추천 도우미입니다. ${readerName ? `${readerName}(${ageText})에게` : `${ageText} 아이에게`} 딱 맞는 동화책을 찾아드릴게요! 📚✨`;
      } else {
        reply = "동화책 추천에 관련된 질문을 해주시면 도움을 드릴 수 있어요! '동화책 추천해줘'라고 말씀해보세요! 🌸";
      }

      return new Response(JSON.stringify({ reply }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // OpenAI 클라이언트 초기화 (gpt-4.1-nano)
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

    // 책 추천 시 상세 질문으로 유도 + 소스 선택 유도
    const isRecommendationRequest = /추천/.test(userMessage);
    const wantsWeb = /(웹\s*검색|웹검색|인터넷|검색|\b2\b|2번)/.test(userMessage);
    const wantsHistory = /(이력|기록|학생|최근|읽었던|비슷|\b1\b|1번)/.test(userMessage);
    
    let prompt = "";
    
    if (isRecommendationRequest && !/(관심|비슷|새로운|웹\s*검색|웹검색|이력|기록|히스토리)/.test(userMessage) && !wantsWeb && !wantsHistory) {
      // 연령대 정보 포함
      const ageText = age ? `${age}세` : '유치원생';
      
      // 단순 추천 요청 시 소스 선택을 포함해 더 자세한 정보를 요청
      prompt = `역할: 매화유치원 ${ageText} 아이를 위한 동화책 추천 도우미
목표: 4단계 대화 흐름을 따르되, 사용자의 답을 기억하며 반복하지 말 것

중요: ${ageText} 아이에게 적합한 동화책, 그림책, 창작동화 위주로 추천할 것

1) 먼저 아이의 상황/관심을 1문장으로 질문
2) 이어서 "추천 소스"를 물음: 1) 친구들이 읽었던 책 2) 온라인 검색 추천도서 (숫자 1 또는 2로 답하도록 유도)
3) 위 답변을 기억하여 최종 추천으로 진행
4) 최종 추천: ${ageText} 아이에게 적합한 동화책 3권 이하, 각 항목에 [제목, 지은이, 출판사, 아주 간단한 줄거리] 포함. 실제 존재하는 동화책인지 확인 후 출력.

지금은 1)번 단계만 질문하세요. 한국어, 1문장.`;
    } else {
      // 단계 흐름: 대화 이력에서 소스/관심을 추정하고 분기
      const historyText = Array.isArray(history)
        ? history.map((m: { role: string; content: string }) => `${m.role === 'user' ? '사용자' : '도우미'}: ${m.content}`).slice(-12).join('\n')
        : '';

      // 사용자 의도 파악
      if (wantsWeb) {
        // 웹검색 기반 즉시 실행 (아래 wantsWeb 분기에서 처리되므로 여기서는 패스)
      } else if (wantsHistory) {
        // 이력 기반 즉시 실행 (아래 wantsHistory 분기에서 처리되므로 여기서는 패스)
      } else if (/공룡|동물|우주|감정|자연|과학|탈것|공주|동화|잠자리|그림책|그림/.test(userMessage)) {
        // 관심 주제가 파악되었으면 2단계(소스 선택)로 유도
        const ageText = age ? `${age}세` : '유치원생';
        prompt = `역할: 매화유치원 ${ageText} 동화책 추천 도우미
아이 정보: 이름=${readerName || '알수없음'}, 나이=${ageText}
최근 읽기: ${readingHistory || '없음'}
대화 일부: ${historyText}
사용자 메시지: ${userMessage}

중요: ${ageText} 아이에게 적합한 동화책, 그림책 위주로 추천할 것

지금은 2)번 단계만 질문하세요. 문구: "추천 소스를 골라주세요. 1) 친구들이 읽었던 책 2) 온라인 검색 추천도서" (한국어, 1문장)`;
      } else {
        // 최종 추천 또는 일반 대화
        const ageText = age ? `${age}세` : '유치원생';
        prompt = `역할: 매화유치원 ${ageText} 동화책 추천 도우미
아이 정보: 이름=${readerName || '알수없음'}, 나이=${ageText}
최근 읽기: ${readingHistory || '없음'}
대화 일부: ${historyText}
사용자 메시지: ${userMessage}

중요: ${ageText} 아이에게 적합한 동화책, 그림책, 창작동화만 추천할 것

요청: 3) 최종 추천을 수행하세요. ${ageText} 아이에게 적합한 동화책 3권 이하, 각 항목에 [제목, 지은이, 출판사, 아주 간단한 줄거리] 포함. 실제 존재하는 동화책을 우선(구글 북스에 조회되는 제목). 한국어, 간결하게.`;
      }
    }

    // 온라인 검색 추천도서로 명시한 경우: 외부 후보 수집 후 LLM 랭킹
    if (wantsWeb) {
      // 대화 히스토리에서 관심 주제 추출
      const historyText = Array.isArray(history)
        ? history.map((m: { role: string; content: string }) => m.content).join(' ')
        : '';
      const topicMatch = (historyText + ' ' + userMessage).match(/(공룡|동물|우주|감정|자연|과학|탈것|공주|동화|잠자리|그림책)/);
      const topic = topicMatch?.[0] || '어린이 추천 도서';

      // 현재 학생이 읽었던 책 목록 (제외용)
      const excludeBooks = readingHistory ? readingHistory.split(', ').map(book => book.replace(/"/g, '').split(' by ')[0]) : [];

      // Open Library 검색
      try {
        const q = encodeURIComponent(topic);
        const ol = await fetch(`https://openlibrary.org/search.json?q=${q}&language=kor|eng&limit=25`, { headers: { 'User-Agent': 'maehwa-book/1.0' } });
        const json = await ol.json();
        const candidates = (json.docs || []).map((d: any) => ({
          title: d.title,
          author: (d.author_name && d.author_name[0]) || '',
          year: d.first_publish_year || null
        }));

        const ageText = age ? `${age}세` : '유치원생(3-7세)';
        const webPrompt = `${ageText} 아이에게 적합한 "${topic}" 주제의 한국어 동화책, 그림책을 3권 이하로 골라주세요. 아래 후보 중 실제 존재하는 동화책 위주로 선택하되, 다음 책들은 제외해주세요: ${excludeBooks.join(', ') || '없음'}. 

중요: 제목이 한자로 된 책은 절대 추천하지 마세요. 반드시 한글 제목의 한국어 동화책만 추천하세요.

각 항목에 [제목, 지은이, 출판사, 아주 간단한 줄거리]를 한 줄로 작성하세요. 번호 목록 형태. 후보: ${JSON.stringify(candidates).slice(0, 5000)}`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4.1-nano',
          messages: [
            { role: 'system', content: '당신은 유치원생을 위한 한국어 동화책 전문 큐레이터입니다. 한글 제목의 동화책, 그림책, 창작동화만 추천하세요. 한자나 영어 제목의 책은 절대 추천하지 마세요. 한국어로 간결하고 따뜻하게 답변합니다. 응답은 JSON 배열 형태로만 출력하세요: [{"title":"제목","author":"지은이","publisher":"출판사","summary":"줄거리"}]' },
            { role: 'user', content: webPrompt }
          ],
          temperature: 0.2,
          max_tokens: 500
        });
        
        let recommendations = [];
        try {
          const content = completion.choices?.[0]?.message?.content || '[]';
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) {
            recommendations = parsed.slice(0, 3);
          }
        } catch {
          // JSON 파싱 실패시 기본 응답
          const reply = `${topic} 주제의 책을 찾아보고 있어요. 조금 더 구체적인 주제를 알려주시면 더 정확한 추천을 해드릴 수 있어요!`;
          return new Response(JSON.stringify({ reply }), { headers: { 'Content-Type': 'application/json' } });
        }

        // 한자 제목 필터링 함수
        const hasChineseCharacters = (text: string) => {
          return /[\u4e00-\u9fff]/.test(text);
        };

        // Google Books API로 실제 존재 여부 확인 및 한자 제목 필터링
        const verifiedBooks = [];
        for (const book of recommendations) {
          // 한자 제목 제외
          if (hasChineseCharacters(book.title)) {
            continue;
          }
          
          try {
            const query = encodeURIComponent(`${book.title} ${book.author}`);
            const gbRes = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}&langRestrict=ko&maxResults=5`);
            const gbData = await gbRes.json();
            
            if (gbData.items && gbData.items.length > 0) {
              // 실제 존재하는 책으로 확인됨
              const item = gbData.items[0];
              const volumeInfo = item.volumeInfo;
              const finalTitle = volumeInfo.title || book.title;
              
              // Google Books에서 가져온 제목도 한자 체크
              if (hasChineseCharacters(finalTitle)) {
                continue;
              }
              
              verifiedBooks.push({
                title: finalTitle,
                author: (volumeInfo.authors && volumeInfo.authors[0]) || book.author,
                publisher: volumeInfo.publisher || book.publisher || '출판사 미상',
                summary: book.summary
              });
            }
          } catch (e) {
            // API 오류시 원본 정보 유지 (한자 제목이 아닌 경우만)
            if (!hasChineseCharacters(book.title)) {
              verifiedBooks.push(book);
            }
          }
          
          if (verifiedBooks.length >= 3) break;
        }

        const reply = verifiedBooks.length > 0 
          ? verifiedBooks.map((b, i) => `${i+1}. [${b.title}, ${b.author}, ${b.publisher}, ${b.summary}]`).join('\n')
          : `${topic} 주제의 검증된 책을 찾지 못했어요. 다른 주제를 시도해보세요.`;
        
        return new Response(JSON.stringify({ reply }), { headers: { 'Content-Type': 'application/json' } });
      } catch (e) {
        const reply = '웹검색 중 오류가 발생했어요. 주제를 바꿔 다시 시도해 주세요.';
        return new Response(JSON.stringify({ reply }), { headers: { 'Content-Type': 'application/json' } });
      }
    }

    // 친구들이 읽었던 책으로 명시한 경우: 모든 학생의 읽기 기록을 활용한 추천
    if (wantsHistory) {
      // 모든 학생의 읽기 기록 가져오기
      const { data: allReadings } = await supabase
        .from('readings')
        .select(`
          book:books(title, author)
        `)
        .order('read_date', { ascending: false })
        .limit(50);

      let allBooksHistory = "";
      if (allReadings && allReadings.length > 0) {
        allBooksHistory = allReadings
          .map(r => `"${(r.book as any)?.title}" by ${(r.book as any)?.author}`)
          .join(', ');
      }

      if (!allBooksHistory || allBooksHistory.length < 10) {
        // 친구들 읽기 기록이 부족하면 온라인 검색으로 대체
        const historyText = Array.isArray(history)
          ? history.map((m: { role: string; content: string }) => m.content).join(' ')
          : '';
        const topicMatch = (historyText + ' ' + userMessage).match(/(공룡|동물|우주|감정|자연|과학|탈것|공주|동화|잠자리|그림책)/);
        const topic = topicMatch?.[0] || '어린이 추천 도서';

        try {
          const q = encodeURIComponent(topic);
          const ol = await fetch(`https://openlibrary.org/search.json?q=${q}&language=kor|eng&limit=25`, { headers: { 'User-Agent': 'maehwa-book/1.0' } });
          const json = await ol.json();
          const candidates = (json.docs || []).map((d: any) => ({
            title: d.title,
            author: (d.author_name && d.author_name[0]) || '',
            year: d.first_publish_year || null
          }));

          const ageText = age ? `${age}세` : '유치원생(3-7세)';
          const fallbackPrompt = `친구들이 읽었던 책이 부족해서 온라인 검색으로 찾아드렸어요. ${ageText} 아이에게 적합한 "${topic}" 주제의 한국어 동화책, 그림책을 3권 이하로 골라주세요. 

중요: 제목이 한자로 된 책은 절대 추천하지 마세요. 반드시 한글 제목의 동화책만 추천하세요.

각 항목에 [제목, 지은이, 출판사, 아주 간단한 줄거리]를 한 줄로 작성하세요. 후보: ${JSON.stringify(candidates).slice(0, 3000)}`;

          const completion = await openai.chat.completions.create({
            model: 'gpt-4.1-nano',
            messages: [
              { role: 'system', content: '당신은 유치원생을 위한 한국어 동화책 전문 큐레이터입니다. 한글 제목의 동화책, 그림책, 창작동화만 추천하세요. 한자나 영어 제목의 책은 절대 추천하지 마세요. 따뜻하고 간결하게 한국어로 답합니다.' },
              { role: 'user', content: fallbackPrompt }
            ],
            temperature: 0.4,
            max_tokens: 400
          });
          const reply = `친구들이 읽었던 책이 부족해서 온라인 검색으로 추천해드렸어요!\n\n${completion.choices?.[0]?.message?.content || '적절한 책을 찾지 못했어요.'}`;
          return new Response(JSON.stringify({ reply }), { headers: { 'Content-Type': 'application/json' } });
        } catch (e) {
          const reply = '친구들이 읽었던 책이 부족하고, 온라인 검색에서도 오류가 발생했어요. 다른 주제를 시도해보세요.';
          return new Response(JSON.stringify({ reply }), { headers: { 'Content-Type': 'application/json' } });
        }
      }

      const ageText = age ? `${age}세` : '유치원생';
      const histPrompt = `다음은 친구들이 최근에 읽었던 동화책 목록입니다: ${allBooksHistory}. ${ageText} 아이에게 적합한 한국어 동화책, 그림책을 3권 이하로 추천하고, 각 항목에 [제목, 지은이, 출판사, 아주 간단한 줄거리]를 한 줄로 작성하세요. 

중요: 제목이 한자로 된 책은 절대 추천하지 마세요. 반드시 한글 제목의 동화책만 추천하세요.

번호 목록.`;
      const completion = await openai.chat.completions.create({
        model: 'gpt-4.1-nano',
        messages: [
          { role: 'system', content: '당신은 유치원생을 위한 한국어 동화책 전문 큐레이터입니다. 한글 제목의 동화책, 그림책, 창작동화만 추천하세요. 한자나 영어 제목의 책은 절대 추천하지 마세요. 따뜻하고 간결하게 한국어로 답합니다.' },
          { role: 'user', content: histPrompt }
        ],
        temperature: 0.4,
        max_tokens: 400
      });
      const reply = completion.choices?.[0]?.message?.content || '친구들이 읽었던 책을 바탕으로 한 추천을 생성하지 못했어요. 주제나 선호를 조금 더 알려 주세요.';
      return new Response(JSON.stringify({ reply }), { headers: { 'Content-Type': 'application/json' } });
    }

    // OpenAI 호출
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [
        { role: "system", content: "당신은 매화유치원의 한국어 동화책 전문 추천 도우미입니다. 유치원생을 위한 한글 제목의 동화책, 그림책, 창작동화만 추천하세요. 한자나 영어 제목의 책은 절대 추천하지 마세요. 한국어로 간결하고 친근하게 답변하세요." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 300
    });
    const reply = completion.choices?.[0]?.message?.content || "죄송해요, 지금은 답변을 드리기 어려워요. 나중에 다시 시도해주세요.";

    return new Response(JSON.stringify({ reply }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Chat recommend error:", error);
    
    // 에러 시 대체 응답
    const fallbackReply = "죄송해요, 지금은 AI 시스템에 문제가 있어서 답변을 드리기 어려워요. 잠시 후 다시 시도해주세요! 📚";
    
    return new Response(JSON.stringify({ reply: fallbackReply }), {
      headers: { "Content-Type": "application/json" },
    });
  }
}