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

  // TODO: Supabase 쿼리로 수정 필요
  const total = 0; // 임시

  // TODO: Supabase 쿼리로 수정 필요
  const topBooks: any[] = []; // 임시
  const bookIds: any[] = []; // 임시
  const books: any[] = []; // 임시

  return NextResponse.json({ total, topBooks: topBooks.map((t) => ({ count: t._count.bookId, book: books.find((b) => b.id === t.bookId) })) });
}

