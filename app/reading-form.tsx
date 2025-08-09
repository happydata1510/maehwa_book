"use client";
import React, { useEffect, useState } from "react";
import BookAutocomplete from "@/app/components/BookAutocomplete";

export default function ReadingForm() {
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [readerName, setReaderName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("activeReaderName");
    if (saved && !readerName) setReaderName(saved);
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
          <input className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300" value={readerName} onChange={(e) => setReaderName(e.target.value)} placeholder="예: 하린" />
          <p className="text-[11px] text-gray-500 mt-1">선택하지 않으면 상단 선택한 아이(있을 경우)로 저장됩니다.</p>
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

