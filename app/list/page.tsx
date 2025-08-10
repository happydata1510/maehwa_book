import { supabase } from "@/app/lib/supabase";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ListPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const sp = await searchParams;
  const page = Number(sp.page ?? "1") || 1;
  const pageSize = 10;
  const [total, items] = await Promise.all([
    prisma.reading.count(),
    prisma.reading.findMany({
      orderBy: { readDate: "desc" },
      include: { book: true, reader: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-jua)" }}>전체 기록</h1>
      <div className="flex justify-end">
        <a className="text-sm px-3 py-1 rounded-lg border" href="/api/export">CSV 내보내기</a>
      </div>
      <ul className="divide-y border rounded-2xl bg-white/80 backdrop-blur shadow-sm">
        {items.map((r) => (
          <li key={r.id} className="p-3 flex items-center justify-between">
            <div>
              <div className="font-medium">{r.book.title}</div>
              <div className="text-xs text-gray-500">{r.book.author} • {new Date(r.readDate).toLocaleDateString()}</div>
            </div>
            <div className="text-xs text-gray-500">{r.reader?.name ?? ""}</div>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-center gap-2">
        <Link className={`px-3 py-1 rounded border ${page <= 1 ? "opacity-50 pointer-events-none" : ""}`} href={`/list?page=${page - 1}`}>
          이전
        </Link>
        <span className="text-sm text-gray-600">
          {page} / {totalPages}
        </span>
        <Link className={`px-3 py-1 rounded border ${page >= totalPages ? "opacity-50 pointer-events-none" : ""}`} href={`/list?page=${page + 1}`}>
          다음
        </Link>
      </div>
    </div>
  );
}

