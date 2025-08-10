import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // format YYYY-MM
  const readerName = searchParams.get("readerName") ?? undefined;

  const where: any = {};
  if (month) {
    const start = new Date(`${month}-01T00:00:00Z`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    where.readDate = { gte: start, lt: end };
  }
  if (readerName) where.reader = { name: readerName };

  const total = await prisma.reading.count({ where });

  const topBooks = await prisma.reading.groupBy({
    by: ["bookId"],
    where,
    _count: { bookId: true },
    orderBy: { _count: { bookId: "desc" } },
    take: 10,
  });
  const bookIds = topBooks.map((b) => b.bookId);
  const books = await prisma.book.findMany({ where: { id: { in: bookIds } } });

  return NextResponse.json({ total, topBooks: topBooks.map((t) => ({ count: t._count.bookId, book: books.find((b) => b.id === t.bookId) })) });
}

