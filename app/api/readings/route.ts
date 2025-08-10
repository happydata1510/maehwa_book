import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";

// GET /api/readings?page=1&pageSize=10&readerName=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") ?? "1") || 1;
    const pageSize = Number(searchParams.get("pageSize") ?? "10") || 10;
    const readerName = searchParams.get("readerName") ?? undefined;

    const where: any = {};
    if (readerName) where.reader = { name: readerName };

    const [total, items] = await Promise.all([
      prisma.reading.count({ where }),
      prisma.reading.findMany({
        where,
        orderBy: { readDate: "desc" },
        include: { book: true, reader: true },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return NextResponse.json({ total, page, pageSize, items });
  } catch (e) {
    console.error("/api/readings GET error", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

// POST /api/readings
// body: { readDate, title, author, readerName, notes }
export async function POST(req: NextRequest) {
  try {
    // Demo 보호: Vercel+SQLite 환경에서는 쓰기 제한 가능
    if (process.env.VERCEL && (process.env.DATABASE_URL ?? "").startsWith("file:")) {
      return NextResponse.json({ error: "데모 환경에서는 기록이 제한됩니다. 로컬 실행 또는 외부 DB를 설정하세요." }, { status: 503 });
    }
    const body = await req.json();
    const { readDate, title, author, readerName, notes } = body ?? {};
    if (!title || !author || !readDate)
      return NextResponse.json({ error: "title, author, readDate required" }, { status: 400 });

    const [book, reader] = await Promise.all([
      prisma.book.upsert({
        where: { title_author: { title, author } },
        update: {},
        create: { title, author },
      }),
      readerName ? prisma.reader.upsert({ where: { name: readerName }, update: {}, create: { name: readerName } }) : Promise.resolve(null),
    ]);

    const reading = await prisma.reading.create({
      data: {
        readDate: new Date(readDate),
        notes: notes ?? null,
        bookId: book.id,
        readerId: reader?.id ?? null,
      },
    });

    return NextResponse.json(reading, { status: 201 });
  } catch (e) {
    console.error("/api/readings POST error", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

