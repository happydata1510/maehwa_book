"use client";
import React, { useEffect, useMemo, useState } from "react";

type Reader = { id: number; name: string; className?: string | null };

export default function ReaderSelector({ onChange }: { onChange?: (name: string | null) => void }) {
  const [readers, setReaders] = useState<Reader[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", className: "", parentPhone: "", age: "" });
  const storageKey = "activeReaderName";

  useEffect(() => {
    const run = async () => {
      const res = await fetch("/api/readers");
      const list = await res.json();
      setReaders(list ?? []);
    };
    setActive(localStorage.getItem(storageKey));
    run();
  }, []);

  const setActiveName = (name: string | null) => {
    setActive(name);
    if (name) localStorage.setItem(storageKey, name); else localStorage.removeItem(storageKey);
    onChange?.(name);
  };

  const submit = async () => {
    if (!form.name.trim()) return;
    const payload: any = { name: form.name.trim() };
    if (form.className) payload.className = form.className.trim();
    if (form.parentPhone) payload.parentPhone = form.parentPhone.trim();
    if (form.age) payload.age = Number(form.age);
    const res = await fetch("/api/readers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (res.ok) {
      const json = await res.json();
      const reader = json.reader as Reader;
      setReaders((prev) => [...prev.filter((r) => r.name !== reader.name), reader].sort((a, b) => a.name.localeCompare(b.name)));
      setActiveName(reader.name);
      setOpen(false);
      setForm({ name: "", className: "", parentPhone: "", age: "" });
      alert(json.message ?? "등록되었습니다.");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <select className="border rounded-lg px-2 py-1" value={active ?? ""} onChange={(e) => setActiveName(e.target.value || null)}>
        <option value="">전체</option>
        {readers.map((r) => (
          <option key={r.id} value={r.name}>
            {r.name}{r.className ? ` (${r.className})` : ""}
          </option>
        ))}
      </select>
      <button type="button" className="text-sm px-2 py-1 rounded-lg border" onClick={() => setOpen((v) => !v)}>아이 등록</button>
      <button type="button" className="text-sm px-2 py-1 rounded-lg border" onClick={() => setActiveName(null)}>초기화</button>
      {open && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-20">
          <div className="bg-white rounded-2xl p-4 w-full max-w-sm shadow">
            <h3 className="font-semibold mb-2">아이 등록</h3>
            <div className="space-y-2">
              <input className="w-full border rounded-lg px-3 py-2" placeholder="이름" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input className="w-full border rounded-lg px-3 py-2" placeholder="반 (예: 매화반)" value={form.className} onChange={(e) => setForm({ ...form, className: e.target.value })} />
              <input className="w-full border rounded-lg px-3 py-2" placeholder="부모 휴대폰번호 (선택)" value={form.parentPhone} onChange={(e) => setForm({ ...form, parentPhone: e.target.value })} />
              <select className="w-full border rounded-lg px-3 py-2" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })}>
                <option value="">나이(선택)</option>
                <option value="5">5세</option>
                <option value="6">6세</option>
                <option value="7">7세</option>
              </select>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button className="px-3 py-1 border rounded-lg" onClick={() => setOpen(false)}>닫기</button>
              <button className="px-3 py-1 rounded-lg bg-pink-500 text-white" onClick={submit}>등록</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

