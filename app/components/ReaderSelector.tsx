"use client";
import React, { useEffect, useMemo, useState } from "react";

type Reader = { id: number; name: string; className?: string | null; parentPhone?: string | null };

export default function ReaderSelector({ onChange }: { onChange?: (name: string | null) => void }) {
  const [readers, setReaders] = useState<Reader[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({ name: "", className: "", parentPhone: "", age: "" });
  const [deleteMode, setDeleteMode] = useState(false);
  const [deletePhone, setDeletePhone] = useState("");
  const [selectedReader, setSelectedReader] = useState<Reader | null>(null);
  const storageKey = "activeReaderName";

  useEffect(() => {
    const run = async () => {
      const q = query.trim();
      if (q.length < 1) {
        // 빈 검색어일 때는 모든 아이들을 보여줌
        const res = await fetch('/api/readers');
        const list = await res.json();
        setReaders(list ?? []);
        return;
      }
      const params = new URLSearchParams();
      params.set("q", q);
      const res = await fetch(`/api/readers?${params.toString()}`);
      const list = await res.json();
      setReaders(list ?? []);
    };
    setActive(localStorage.getItem(storageKey));
    run();
  }, [query]);

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
    try {
      const res = await fetch("/api/readers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) {
        const text = await res.text();
        let msg = "등록 실패";
        try { const j = JSON.parse(text); msg = j.error ?? msg; } catch {}
        alert(msg);
        return;
      }
      const json = await res.json();
      const reader = json.reader as Reader;
      setReaders((prev) => [...prev.filter((r) => r.name !== reader.name), reader].sort((a, b) => a.name.localeCompare(b.name)));
      setActiveName(reader.name);
      setOpen(false);
      setForm({ name: "", className: "", parentPhone: "", age: "" });
      alert(json.message ?? "등록되었습니다.");
    } catch (e) {
      alert("네트워크 오류로 등록에 실패했습니다.");
    }
  };

  const handleDelete = async () => {
    if (!selectedReader || !deletePhone.trim()) {
      alert("휴대폰 번호를 입력해주세요.");
      return;
    }
    
    // 부모 휴대폰 번호 확인 (실제로는 DB에서 확인해야 하지만, 간단히 구현)
    if (deletePhone.trim() !== selectedReader.parentPhone) {
      alert("휴대폰 번호가 일치하지 않습니다.");
      return;
    }
    
    try {
      const res = await fetch(`/api/readers/${selectedReader.id}`, { method: "DELETE" });
      if (!res.ok) {
        alert("삭제에 실패했습니다.");
        return;
      }
      
      setReaders(prev => prev.filter(r => r.id !== selectedReader.id));
      if (active === selectedReader.name) {
        setActiveName(null);
      }
      setDeleteMode(false);
      setDeletePhone("");
      setSelectedReader(null);
      alert("삭제되었습니다.");
    } catch (e) {
      alert("네트워크 오류로 삭제에 실패했습니다.");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <input
          className="border rounded-lg px-2 py-1 w-48"
          placeholder="아이 선택/검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
        />
        {open && (
          <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg max-h-56 overflow-auto">
            <div className="px-2 py-1 text-xs text-gray-500">아이 선택</div>
            <div className="px-2 py-1 hover:bg-gray-50 cursor-pointer" onClick={() => { setActiveName(null); setQuery(""); setOpen(false); }}>전체</div>
            {readers.map((r) => (
              <div key={r.id} className="px-2 py-1 hover:bg-gray-50 cursor-pointer flex justify-between items-center">
                <span onClick={() => { setActiveName(r.name); setQuery(r.name); setOpen(false); }}>
                  {r.name}{r.className ? ` (${r.className})` : ""}
                  {active === r.name && <span className="text-pink-500 ml-1">✓</span>}
                </span>
                <button 
                  className="text-red-500 hover:text-red-700 text-xs px-1"
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setSelectedReader(r); 
                    setDeleteMode(true); 
                    setOpen(false); 
                  }}
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <button type="button" className="text-sm px-2 py-1 rounded-lg border" onClick={() => setOpen((v) => !v)}>아이 등록</button>
      {open && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-20">
          <div className="bg-white rounded-2xl p-4 w-full max-w-sm shadow">
            <h3 className="font-semibold mb-2">아이 등록</h3>
            <div className="space-y-2">
              <input className="w-full border rounded-lg px-3 py-2" placeholder="이름" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input className="w-full border rounded-lg px-3 py-2" placeholder="반 (예: 매화반)" value={form.className} onChange={(e) => setForm({ ...form, className: e.target.value })} />
              <input className="w-full border rounded-lg px-3 py-2" placeholder="부모 휴대폰번호 (필수)" value={form.parentPhone} onChange={(e) => setForm({ ...form, parentPhone: e.target.value })} />
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
      {deleteMode && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-20">
          <div className="bg-white rounded-2xl p-4 w-full max-w-sm shadow">
            <h3 className="font-semibold mb-2 text-red-600">아이 삭제</h3>
            <p className="text-sm text-gray-600 mb-3">
              {selectedReader?.name} 아이를 삭제하시겠습니까?<br/>
              부모님의 휴대폰 번호를 입력해주세요.
            </p>
            <input 
              className="w-full border rounded-lg px-3 py-2" 
              placeholder="부모 휴대폰번호" 
              value={deletePhone} 
              onChange={(e) => setDeletePhone(e.target.value)} 
            />
            <div className="mt-3 flex justify-end gap-2">
              <button className="px-3 py-1 border rounded-lg" onClick={() => { setDeleteMode(false); setDeletePhone(""); setSelectedReader(null); }}>취소</button>
              <button className="px-3 py-1 rounded-lg bg-red-500 text-white" onClick={handleDelete}>삭제</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

