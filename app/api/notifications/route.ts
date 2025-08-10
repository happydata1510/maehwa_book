import { NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";

// GET /api/notifications -> milestone alerts (100,200,...)
export async function GET() {
  // TODO: Supabase 쿼리로 수정 필요
  const groups: any[] = []; // 임시
  const alerts: Array<{ readerName: string; milestone: number }> = [];
  for (const g of groups) {
    if (!g.readerId) continue;
    const count = g._count.readerId;
    const milestone = Math.floor(count / 100) * 100;
    if (milestone >= 100) {
      // TODO: Supabase 쿼리로 수정 필요
    const reader: any = null; // 임시
      if (reader) alerts.push({ readerName: reader.name, milestone });
    }
  }
  return NextResponse.json({ alerts });
}

