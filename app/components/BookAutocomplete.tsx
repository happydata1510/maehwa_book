"use client";
import React, { useEffect, useMemo, useState } from "react";

type Book = { id: number; title: string; author: string };

type Props = {
  age?: number;
  onSelect: (book: Book) => void;
};

export default function BookAutocomplete({ age, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Book[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      try {
        if (!query) {
          setResults([]);
          return;
        }
        const params = new URLSearchParams();
        params.set("query", query);
        if (age) params.set("age", String(age));
        const res = await fetch(`/api/books?${params.toString()}`, { signal: controller.signal });
        if (!res.ok) {
          setResults([]);
          return;
        }
        const text = await res.text();
        if (!text) {
          setResults([]);
          return;
        }
        const data = JSON.parse(text);
        setResults(Array.isArray(data) ? data : []);
      } catch (err: any) {
        if (err?.name === "AbortError" || err?.message?.includes("aborted")) {
          return;
        }
        setResults([]);
      }
    };
    const id = setTimeout(run, 200);
    return () => {
      clearTimeout(id);
      controller.abort();
    };
  }, [query, age]);

  return (
    <div className="relative">
      <input
        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
        placeholder="제목 또는 글쓴이 검색"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {open && results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white/95 backdrop-blur border rounded-xl shadow-lg max-h-60 overflow-auto">
          {results.map((b) => (
            <button
              type="button"
              key={b.id}
              className="block w-full text-left px-3 py-2 hover:bg-pink-50"
              onClick={() => {
                onSelect(b);
                setQuery(`${b.title} - ${b.author}`);
                setOpen(false);
              }}
            >
              <div className="font-medium">{b.title}</div>
              <div className="text-xs text-gray-500">{b.author}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

