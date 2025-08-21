import { NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";

// GET /api/notifications -> alerts when approaching 100, 200, ... (within 5)
export async function GET() {
  try {
    // Load all readers (id, name)
    const { data: readers } = await supabase
      .from('readers')
      .select('id, name');

    const readerById = new Map<number, string>();
    (readers || []).forEach(r => readerById.set(r.id as number, r.name as string));

    // Load reading rows (reader_id) and count by reader
    const { data: readingRows } = await supabase
      .from('readings')
      .select('reader_id');

    const countByReader = new Map<number, number>();
    (readingRows || []).forEach(row => {
      const rid = row.reader_id as number | null;
      if (!rid) return;
      countByReader.set(rid, (countByReader.get(rid) || 0) + 1);
    });

    const alerts: Array<{ readerName: string; milestone: number; remaining: number }> = [];

    for (const [rid, count] of countByReader.entries()) {
      const nextMilestone = (Math.floor(count / 100) + 1) * 100;
      const remaining = nextMilestone - count;
      if (remaining <= 5) {
        const readerName = readerById.get(rid);
        if (readerName) alerts.push({ readerName, milestone: nextMilestone, remaining });
      }
    }

    // Sort by urgency (fewest remaining first)
    alerts.sort((a, b) => a.remaining - b.remaining);

    return NextResponse.json({ alerts });
  } catch (e) {
    console.error('/api/notifications error', e);
    return NextResponse.json({ alerts: [] });
  }
}

