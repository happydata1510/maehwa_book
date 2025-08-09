"use client";
import React, { useEffect, useRef, useState } from "react";

type Book = { id: number; title: string; author: string };

export default function RecommendPage() {
  const [age, setAge] = useState<number | undefined>(5);
  const [books, setBooks] = useState<Book[]>([]);
  const [chat, setChat] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

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
    setChat((c) => [...c, { role: "user", content: msg }]);
    inputRef.current!.value = "";
    const res = await fetch("/api/chat-recommend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: msg, age }) });
    const data = await res.json();
    setChat((c) => [...c, { role: "assistant", content: data.reply }]);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-jua)" }}>추천도서</h1>
      <div className="flex gap-2 items-center">
        <label className="text-sm">연령대:</label>
        <select className="border rounded-md px-2 py-1" value={age} onChange={(e) => setAge(Number(e.target.value))}>
          <option value={5}>5세</option>
          <option value={6}>6세</option>
          <option value={7}>7세</option>
        </select>
      </div>
      <div className="rounded-2xl border bg-white/80 backdrop-blur p-4 space-y-3">
        <h2 className="font-semibold">챗봇 추천</h2>
        <div className="max-h-64 overflow-auto space-y-2">
          {chat.map((m, i) => (
            <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
              <span className={`inline-block px-3 py-2 rounded-2xl ${m.role === "user" ? "bg-pink-500 text-white" : "bg-gray-100"}`}>{m.content}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input ref={inputRef} className="flex-1 border rounded-lg px-3 py-2" placeholder="오늘 읽어줄 책 추천해줘" />
          <button className="px-3 py-2 rounded-lg bg-pink-500 text-white" onClick={send}>보내기</button>
        </div>
      </div>
      <ul className="divide-y border rounded-2xl bg-white/80 backdrop-blur shadow-sm">
        {books.map((b) => (
          <li key={b.id} className="p-3">
            <div className="font-medium">{b.title}</div>
            <div className="text-xs text-gray-500">{b.author}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

