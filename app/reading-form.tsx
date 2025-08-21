"use client";
import React, { useEffect, useState } from "react";
import BookAutocomplete from "@/app/components/BookAutocomplete";

interface ReadingFormProps {
  onRecordAdded?: () => void;
}

export default function ReadingForm({ onRecordAdded }: ReadingFormProps) {
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [readerName, setReaderName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // 아이 선택 상태를 실시간으로 감지
  useEffect(() => {
    const updateReaderName = () => {
      const saved = localStorage.getItem("activeReaderName");
      setReaderName(saved || "");
    };

    // 초기 로드
    updateReaderName();

    // localStorage 변경 감지
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "activeReaderName") {
        updateReaderName();
      }
    };

    // 포커스 이벤트로 다른 탭에서의 변경사항 감지
    const handleFocus = () => {
      updateReaderName();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);

    // 주기적으로 체크 (같은 페이지 내에서 변경된 경우)
    const interval = setInterval(updateReaderName, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, []);

  const handleSelect = (b: { title: string; author: string }) => {
    setTitle(b.title);
    setAuthor(b.author);
  };



  const submit = async () => {
    if (!date || !title || !author) {
      setMessage("날짜, 제목, 글쓴이를 입력하세요");
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const effectiveReaderName = readerName || localStorage.getItem("activeReaderName") || undefined;
      const res = await fetch("/api/readings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readDate: date, title, author, readerName: effectiveReaderName }),
      });
      if (!res.ok) throw new Error("저장 실패");
      
      setMessage("기록되었습니다.");
      setTitle("");
      setAuthor("");
      
      // 부모 컴포넌트에 기록 추가 알림
      if (onRecordAdded) {
        onRecordAdded();
      }
      
      // 2초 후 메시지 자동 제거
      setTimeout(() => {
        setMessage(null);
      }, 2000);
      
    } catch (e) {
      const msg = e instanceof Error ? e.message : "오류가 발생했습니다";
      setMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border rounded-2xl p-5 space-y-3 bg-white/90 backdrop-blur shadow-sm">
      <h2 className="font-semibold flex items-center gap-2" style={{ fontFamily: "var(--font-jua)" }}>
        <span>📚</span> 읽기 기록 추가
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-600">읽은 날짜</label>
          <input type="date" className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-gray-600">어린이 이름</label>
          <input 
            className="w-full border rounded-lg px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-300" 
            value={readerName || "전체 기록으로 저장"} 
            readOnly
            placeholder="아이를 선택해주세요" 
          />
          <p className="text-[11px] text-gray-500 mt-1">
            {readerName ? `${readerName}의 기록으로 저장됩니다.` : "상단에서 아이를 선택하거나 전체 기록으로 저장됩니다."}
          </p>
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs text-gray-600">제목/글쓴이 자동완성</label>
          <BookAutocomplete onSelect={handleSelect} />
        </div>

        <div>
          <label className="text-xs text-gray-600">제목</label>
          <input className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-gray-600">글쓴이</label>
          <input className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300" value={author} onChange={(e) => setAuthor(e.target.value)} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button disabled={submitting} onClick={submit} className="px-4 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 transition text-white disabled:opacity-50">
          {submitting ? "저장 중..." : "기록하기"}
        </button>
        {message && <span className="text-sm text-gray-600">{message}</span>}
      </div>
    </div>
  );
}

