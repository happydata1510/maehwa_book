import { supabase } from "@/app/lib/supabase";
import Link from "next/link";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export default async function TeachersPage({ searchParams }: { searchParams: Promise<{ q?: string; className?: string }> }) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const className = sp.className?.trim() ?? "";
  const readers = await prisma.reader.findMany({
    where: {
      AND: [
        q ? { name: { contains: q } } : {},
        className ? { className } : {},
      ],
    },
    orderBy: { className: "asc" },
  });
  const stats = await prisma.reading.groupBy({ by: ["readerId"], _count: { readerId: true } });
  const countByReader = new Map(stats.map((s) => [s.readerId, s._count.readerId] as const));

  const latestByReader = await prisma.reading.findMany({
    orderBy: { readDate: "desc" },
    include: { book: true },
  });
  const latestMap = new Map<number, { title: string; date: Date }>();
  for (const r of latestByReader) {
    if (r.readerId && !latestMap.has(r.readerId)) {
      latestMap.set(r.readerId, { title: r.book.title, date: r.readDate });
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-jua)" }}>교사용 개요</h1>
      <Notifications />
      <form className="flex gap-2 items-end">
        <div>
          <label className="text-xs text-gray-600">이름 검색</label>
          <input name="q" defaultValue={q} className="border rounded-lg px-3 py-2" placeholder="아이 이름" />
        </div>
        <div>
          <label className="text-xs text-gray-600">반</label>
          <input name="className" defaultValue={className} className="border rounded-lg px-3 py-2" placeholder="예: 매화반" />
        </div>
        <button className="h-[38px] px-3 rounded-lg border">필터</button>
      </form>
      <div className="rounded-2xl border bg-white/80 backdrop-blur overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">반</th>
              <th className="px-3 py-2 text-left">이름</th>
              <th className="px-3 py-2 text-right">총 권수</th>
              <th className="px-3 py-2">최근 읽은 책</th>
              <th className="px-3 py-2">최근 날짜</th>
            </tr>
          </thead>
          <tbody>
            {readers.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2">{r.className ?? "-"}</td>
                <td className="px-3 py-2">
                  <Link className="text-pink-600" href={`/teachers/${encodeURIComponent(r.name)}`}>{r.name}</Link>
                </td>
                <td className="px-3 py-2 text-right">{countByReader.get(r.id) ?? 0}</td>
                <td className="px-3 py-2">{latestMap.get(r.id)?.title ?? "-"}</td>
                <td className="px-3 py-2">{latestMap.get(r.id)?.date ? new Date(latestMap.get(r.id)!.date).toLocaleDateString() : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-sm text-gray-600">학생 이름을 클릭하면 해당 학생의 목록 페이지로 이동합니다.</div>
    </div>
  );
}

async function Notifications() {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || "http";
  const base = `${proto}://${host}`;
  const res = await fetch(`${base}/api/notifications`, { cache: "no-store" });
  const data = await res.json();
  const alerts: Array<{ readerName: string; milestone: number }> = data.alerts ?? [];
  if (alerts.length === 0) return null;
  return (
    <div className="rounded-xl border bg-yellow-50 text-yellow-900 p-3 text-sm">
      {alerts.map((a, i) => (
        <div key={i}>🎉 {a.readerName} 학생이 {a.milestone}권을 달성했습니다!</div>
      ))}
    </div>
  );
}

