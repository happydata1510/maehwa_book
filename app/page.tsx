import Link from "next/link";
import BadgeGrid from "@/app/components/BadgeGrid";
import ReaderSelector from "@/app/components/ReaderSelector";
import StatsBar from "@/app/components/StatsBar";
import { supabase } from "@/app/lib/supabase";
import ReadingForm from "./reading-form";

export default async function Home() {
  // 최근 읽기 기록 가져오기
  const { data: items } = await supabase
    .from('readings')
    .select(`
      *,
      book:books(*),
      reader:readers(*)
    `)
    .order('read_date', { ascending: false })
    .limit(10);

  // 전체 읽기 기록 수 계산
  const { count: total } = await supabase
    .from('readings')
    .select('*', { count: 'exact', head: true });

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold flex items-center gap-2" style={{ fontFamily: "var(--font-jua)" }}>
          <span>🌸</span> 매화유치원 책대장
        </h1>
        <div className="text-center">
          <p className="text-lg sm:text-xl font-bold text-pink-600" style={{ fontFamily: "var(--font-jua)" }}>
            우리 아이들과 책을 읽는 시간을 하루 5분이라도 가져요
          </p>
        </div>
        <div className="flex items-center justify-between">
          <ReaderSelector />
        </div>
        <StatsBar />
      </header>

      <ReadingForm />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">최근 기록</h2>
          <Link href="/list" className="text-sm text-blue-600">전체 보기</Link>
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
              아직 읽기 기록이 없습니다. 첫 번째 책을 기록해보세요!
            </li>
          )}
        </ul>
      </section>

      <section>
        <BadgeGrid totalCount={total || 0} />
      </section>
    </div>
  );
}
