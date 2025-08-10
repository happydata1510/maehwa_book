import { supabase } from "@/app/lib/supabase";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ListPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const sp = await searchParams;
  const page = Number(sp.page ?? "1") || 1;
  const pageSize = 10;
  // Supabase에서 페이지네이션된 읽기 기록 가져오기
  const { data: items } = await supabase
    .from('readings')
    .select(`
      *,
      book:books(*),
      reader:readers(*)
    `)
    .order('read_date', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  // 전체 기록 수 계산
  const { count: total } = await supabase
    .from('readings')
    .select('*', { count: 'exact', head: true });
  const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize));

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-jua)" }}>전체 기록</h1>
      <div className="flex justify-end">
        <a className="text-sm px-3 py-1 rounded-lg border" href="/api/export">CSV 내보내기</a>
      </div>
      <ul className="divide-y border rounded-2xl bg-white/80 backdrop-blur shadow-sm">
        {(items || []).map((r) => (
          <li key={r.id} className="p-3 flex items-center justify-between">
            <div>
              <div className="font-medium">{r.book?.title || '제목 없음'}</div>
              <div className="text-xs text-gray-500">{r.book?.author || '작가 없음'} • {new Date(r.read_date).toLocaleDateString()}</div>
            </div>
            <div className="text-xs text-gray-500">{r.reader?.name ?? ""}</div>
          </li>
        ))}
        {(!items || items.length === 0) && (
          <li className="p-6 text-center text-gray-500">
            아직 읽기 기록이 없습니다.
          </li>
        )}
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

