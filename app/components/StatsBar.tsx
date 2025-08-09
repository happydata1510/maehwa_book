"use client";
import React, { useEffect, useState } from "react";

export default function StatsBar() {
  const [readerName, setReaderName] = useState<string | null>(null);
  const [data, setData] = useState<{ count: number; latestTitle: string | null; latestDate: string | null } | null>(null);
  const [target, setTarget] = useState<number | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const key = localStorage.getItem("activeReaderName");
    setReaderName(key);
  }, []);

  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams();
      if (readerName) params.set("readerName", readerName);
      const res = await fetch(`/api/reader-stats?${params.toString()}`);
      const json = await res.json();
      setData(json);
      if (json?.count != null) {
        const thresholds = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
        const next = thresholds.find((t: number) => t > json.count) ?? null;
        setTarget(next);
        setRemaining(next ? next - json.count : null);
      }
    };
    run();
  }, [readerName]);

  return (
    <div className="rounded-2xl border bg-white/80 backdrop-blur p-3 text-sm flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span>👶</span>
        <span className="font-medium">{readerName ? `${readerName}의 요약` : "전체 요약"}</span>
      </div>
      <div className="text-gray-700">
        {data ? (
          <span>
            총 {data.count}권{data.latestTitle ? ` • 최근: ${data.latestTitle}` : ""}
            {data.latestDate ? ` (${new Date(data.latestDate).toLocaleDateString()})` : ""}
            {target ? ` • 다음 목표: ${target}권` : ""}
            {remaining != null ? ` (남은 ${remaining}권)` : ""}
          </span>
        ) : (
          <span>로딩 중…</span>
        )}
      </div>
    </div>
  );
}

