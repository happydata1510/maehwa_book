"use client";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import "chart.js/auto";
const Bar = dynamic(() => import("react-chartjs-2").then((m) => m.Bar), { ssr: false });

type TopItem = { count: number; book: { id: number; title: string; author: string } };

export default function StatsPage() {
  const [month, setMonth] = useState<string>(() => new Date().toISOString().slice(0, 7));
  const [studentName, setStudentName] = useState<string>("");
  const [total, setTotal] = useState(0);
  const [top, setTop] = useState<TopItem[]>([]);
  const [series, setSeries] = useState<{ labels: string[]; data: number[] }>({ labels: [], data: [] });
  const [ranges, setRanges] = useState<string[]>([]);
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    const run = async () => {
      const name = localStorage.getItem("activeReaderName") ?? "";
      setStudentName(name);
      const params = new URLSearchParams();
      if (month) params.set("month", month);
      if (name) params.set("readerName", name);
      const res = await fetch(`/api/stats?${params.toString()}`);
      const data = await res.json();
      setTotal(data.total ?? 0);
      setTop(data.topBooks ?? []);
    };
    run();
  }, [month]);

  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      try {
        const readerName = localStorage.getItem("activeReaderName") ?? "";
        const params = new URLSearchParams();
        if (readerName) params.set("readerName", readerName);
        params.set("anchorMonth", month);
        params.set("weeks", "10");
        const res = await fetch(`/api/stats/timeseries?${params.toString()}`, { signal: controller.signal });
        const data = await res.json();
        setSeries({ labels: data.labels ?? [], data: data.data ?? [] });
        setRanges(data.ranges ?? []);
        setYear(data.year ?? null);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
      }
    };
    run();
    return () => controller.abort();
  }, [month]);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-jua)" }}>통계</h1>
      <div className="rounded-2xl border bg-white/80 backdrop-blur p-4">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-semibold">주별 읽은 권수</h2>
          {year && <div className="text-sm text-gray-500">{year}년</div>}
        </div>
        <div style={{ height: 260 }}>
          {series.labels.length > 0 ? (
            <Bar
              data={{
                labels: series.labels,
                datasets: [
                  {
                    label: "권수",
                    data: series.data,
                    backgroundColor: "rgba(236,72,153,0.6)",
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { callbacks: { title: (items) => { const i = items[0]?.dataIndex ?? 0; return ranges[i] ?? ""; } } } },
                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
              }}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-gray-500">데이터가 없습니다</div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-gray-600">월 선택</label>
          <input type="month" className="w-full border rounded-md px-3 py-2" value={month} onChange={(e) => setMonth(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-gray-600">학생</label>
          <input disabled className="w-full border rounded-md px-3 py-2 bg-gray-50" value={studentName || "(전체)"} />
        </div>
        <div className="flex items-end">
          <div className="w-full border rounded-md px-3 py-2 bg-gray-50">총 {total}권</div>
        </div>
      </div>
      <div>
        <h2 className="font-semibold mb-2">많이 읽은 책 TOP 10</h2>
        <ul className="divide-y border rounded-2xl bg-white/80 backdrop-blur shadow-sm">
          {top.map((t, idx) => (
            <li key={t.book.id} className="p-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{idx + 1}. {t.book.title}</div>
                <div className="text-xs text-gray-500">{t.book.author}</div>
              </div>
              <div className="text-sm text-gray-700">{t.count}회</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

