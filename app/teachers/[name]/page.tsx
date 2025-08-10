import { supabase } from "@/app/lib/supabase";

export const dynamic = "force-dynamic";

export default async function TeacherStudentPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const decoded = decodeURIComponent(name);
  // 학생 정보 가져오기
  const { data: reader } = await supabase
    .from('readers')
    .select('*')
    .eq('name', decoded)
    .single();

  // 학생의 읽기 기록 가져오기
  const { data: items } = await supabase
    .from('readings')
    .select(`
      *,
      book:books(*)
    `)
    .eq('reader_id', reader?.id)
    .order('read_date', { ascending: false });
  const total = (items || []).length;
  const nextTarget = [100,200,300,400,500,600,700,800,900,1000].find((t) => t > total) ?? null;
  const remaining = nextTarget ? nextTarget - total : null;
  const reached = Math.floor(total / 100) * 100;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">{decoded} 학생 기록</h1>
      <div className="text-sm text-gray-700">총 {total}권 • {nextTarget ? `다음 목표 ${nextTarget}권 (남은 ${remaining}권)` : "최고 목표 달성"} • 최근 100단계: {reached}권</div>
      <div className="flex justify-end">
        <a className="text-sm px-3 py-1 rounded-lg border" href={`/api/export?readerName=${encodeURIComponent(name)}`}>CSV 내보내기</a>
      </div>
      <ul className="divide-y border rounded-2xl bg-white/80 backdrop-blur shadow-sm">
        {(items || []).map((r) => (
          <li key={r.id} className="p-3 flex items-center justify-between">
            <div>
              <div className="font-medium">{(r.book as any)?.title || '제목 없음'}</div>
              <div className="text-xs text-gray-500">{(r.book as any)?.author || '저자 없음'} • {new Date(r.read_date).toLocaleDateString()}</div>
            </div>
          </li>
        ))}
        {(!items || items.length === 0) && (
          <li className="p-6 text-center text-gray-500">
            아직 읽기 기록이 없습니다.
          </li>
        )}
      </ul>
    </div>
  );
}

