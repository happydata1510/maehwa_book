"use client";
import React, { useEffect, useRef, useState } from "react";

type Book = { id?: number; title: string; author: string; reason?: string };

export default function RecommendPage() {
  const [age, setAge] = useState<number | undefined>(5);
  const [books, setBooks] = useState<Book[]>([]);
  type ChatMsg = { role: "user" | "assistant"; content: string };
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [readerName, setReaderName] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  const CHAT_STORAGE_KEY = "mw_chat_history";
  const [sending, setSending] = useState(false);

  // 선택된 아이 정보 가져오기
  useEffect(() => {
    const updateReaderName = () => {
      const saved = localStorage.getItem("activeReaderName");
      setReaderName(saved || "");
    };

    updateReaderName();
    
    // localStorage 변경 감지
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "activeReaderName") {
        updateReaderName();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams();
      if (age) params.set("age", String(age));
      const res = await fetch(`/api/recommend?${params.toString()}`);
      const data = await res.json();
      setBooks(data ?? []);
    };
    run();
  }, [age]);

  const send = async () => {
    const msg = inputRef.current?.value?.trim();
    if (!msg) return;
    const nextHistory: ChatMsg[] = [...chat, { role: "user", content: msg }];
    setChat(nextHistory);
    inputRef.current!.value = "";
    if (sending) return;
    setSending(true);
    
    try {
      const res = await fetch("/api/chat-recommend", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ 
          message: msg, 
          age,
          readerName: readerName || undefined,
          history: nextHistory
        }) 
      });
      const data = await res.json();
      setChat((c) => [...c, { role: "assistant", content: data.reply }]);
    } catch (error) {
      console.error("채팅 추천 오류:", error);
      setChat((c) => [...c, { role: "assistant", content: "죄송해요, 일시적인 오류가 발생했습니다. 다시 시도해주세요." }]);
    } finally {
      setSending(false);
    }
  };

  // 초기 환영 메시지 또는 저장된 대화 복원
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const sanitized: ChatMsg[] = parsed
            .map((m: any): ChatMsg => ({
              role: m?.role === "user" ? ("user" as const) : ("assistant" as const),
              content: String(m?.content ?? "")
            }))
            .filter((m) => m.content.length > 0);
          if (sanitized.length > 0) setChat(sanitized);
          return;
        }
      }
    } catch {}
    const welcomeMessage = readerName 
      ? `안녕하세요! ${readerName}에게 맞는 책을 추천해드릴게요. 어떤 종류의 책을 찾고 계신가요? 🌸📚`
      : "안녕하세요! 매화유치원 책 추천 도우미입니다. 어떤 책을 추천해드릴까요? 🌸📚";
    setChat([{ role: "assistant", content: welcomeMessage }]);
  }, [readerName]);

  // 대화 저장
  useEffect(() => {
    try { localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(chat)); } catch {}
  }, [chat]);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-jua)" }}>
        🤖 AI 추천도서 (OpenAI GPT-4.1-nano)
      </h1>
      
      {/* 현재 선택된 아이와 연령 정보 */}
      <div className="rounded-2xl border bg-blue-50/80 backdrop-blur p-3 space-y-2">
        <div className="flex gap-4 items-center text-sm">
          <div>
            <span className="text-gray-600">선택된 아이:</span>
            <span className="font-medium ml-1">{readerName || "전체"}</span>
          </div>
          <div className="flex gap-2 items-center">
            <label className="text-gray-600">연령대:</label>
            <select 
              className="border rounded-md px-2 py-1 text-sm" 
              value={age} 
              onChange={(e) => setAge(Number(e.target.value))}
            >
              <option value={3}>3세</option>
              <option value={4}>4세</option>
              <option value={5}>5세</option>
              <option value={6}>6세</option>
              <option value={7}>7세</option>
            </select>
          </div>
        </div>
      </div>
      <div className="rounded-2xl border bg-white/80 backdrop-blur p-4 space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          🤖 AI 책 추천 챗봇
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
            OpenAI
          </span>
        </h2>
        <div className="max-h-80 overflow-auto space-y-2 bg-gray-50 rounded-lg p-3">
          {chat.map((m, i) => (
            <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
              <span className={`inline-block px-3 py-2 rounded-2xl max-w-xs break-words ${
                m.role === "user" 
                  ? "bg-pink-500 text-white" 
                  : "bg-white border shadow-sm"
              }`}>
                {m.content}
              </span>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input 
            ref={inputRef} 
            className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300" 
            placeholder={readerName ? `${readerName}에게 추천할 책을 물어보세요!` : "어떤 책을 추천해드릴까요?"} 
            onKeyDown={(e) => {
              // IME 조합 중 Enter 방지 (React 이벤트에서 안전히 조회)
              const ev = e as unknown as { isComposing?: boolean; nativeEvent?: { isComposing?: boolean } };
              const composing = (ev.isComposing ?? ev.nativeEvent?.isComposing) === true;
              if (e.key === "Enter" && !composing) send();
            }}
          />
          <button 
            className="px-4 py-2 rounded-lg bg-pink-500 hover:bg-pink-600 text-white transition-colors disabled:opacity-60" 
            onClick={send}
            disabled={sending}
          >
            보내기
          </button>
        </div>
        <div className="text-xs text-gray-500">
          💡 예시: &quot;5세 아이에게 좋은 동물 그림책 추천해줘&quot;, &quot;잠들기 전에 읽어줄 책은?&quot;
        </div>
      </div>
      
      <div className="space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          📚 인기 도서 (데이터 기반)
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
            {age}세 연령대
          </span>
        </h2>
        <ul className="divide-y border rounded-2xl bg-white/80 backdrop-blur shadow-sm">
          {books.length > 0 ? (
            books.map((b, idx) => (
              <li key={b.id ?? `${b.title}-${idx}`} className="p-3">
                <div className="font-medium">{b.title}</div>
                <div className="text-xs text-gray-500">{b.author}</div>
                {b.reason && <div className="text-xs text-gray-600 mt-1">{b.reason}</div>}
              </li>
            ))
          ) : (
            <li className="p-6 text-center text-gray-500">
              {age}세 연령대에 맞는 책을 찾고 있어요...
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

