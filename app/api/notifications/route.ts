import { NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";

// GET /api/notifications -> milestone alerts (100,200,...)
export async function GET() {
  const groups = await prisma.reading.groupBy({ by: ["readerId"], _count: { readerId: true } });
  const alerts: Array<{ readerName: string; milestone: number }> = [];
  for (const g of groups) {
    if (!g.readerId) continue;
    const count = g._count.readerId;
    const milestone = Math.floor(count / 100) * 100;
    if (milestone >= 100) {
      const reader = await prisma.reader.findUnique({ where: { id: g.readerId } });
      if (reader) alerts.push({ readerName: reader.name, milestone });
    }
  }
  return NextResponse.json({ alerts });
}

