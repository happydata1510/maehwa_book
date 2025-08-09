"use client";
import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function TeachersLoginPage() {
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") ?? "/teachers";

  const submit = async () => {
    if (code.trim() === (process.env.NEXT_PUBLIC_TEACHER_CODE || "1234")) {
      document.cookie = `teacher_auth=1; path=/; max-age=86400`;
      router.push(next);
    } else {
      setMsg("인증 코드가 올바르지 않습니다");
    }
  };

  return (
    <div className="max-w-sm mx-auto p-6 space-y-3">
      <h1 className="text-xl font-semibold">교사용 로그인</h1>
      <input className="w-full border rounded-lg px-3 py-2" placeholder="인증 코드" value={code} onChange={(e) => setCode(e.target.value)} />
      <button className="w-full rounded-lg bg-pink-500 text-white py-2" onClick={submit}>입장하기</button>
      {msg && <div className="text-sm text-red-600">{msg}</div>}
      <div className="text-xs text-gray-500">테스트용 코드: 1234 (NEXT_PUBLIC_TEACHER_CODE 환경변수로 변경 가능)</div>
    </div>
  );
}

