import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";

// GET /api/reader-stats?readerName=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const readerName = searchParams.get("readerName") ?? undefined;

    const where: any = {};
    if (readerName) where.reader = { name: readerName };

    const [count, latest] = await Promise.all([
      prisma.reading.count({ where }),
      prisma.reading.findFirst({ where, orderBy: { readDate: "desc" }, include: { book: true } }),
    ]);

    return NextResponse.json({
      count,
      latestTitle: latest?.book.title ?? null,
      latestDate: latest?.readDate ?? null,
    });
  } catch (e) {
    console.error("/api/reader-stats GET error", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

