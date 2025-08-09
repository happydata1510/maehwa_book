import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

// Very simple rule-based recommender using existing DB + popularity
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const age = Number(searchParams.get("age") ?? "0") || undefined;
  const limit = Number(searchParams.get("limit") ?? "10") || 10;

  const whereBook: any = {};
  if (age) {
    whereBook.AND = [
      { OR: [{ ageMin: null }, { ageMin: { lte: age } }] },
      { OR: [{ ageMax: null }, { ageMax: { gte: age } }] },
    ];
  }

  // Top popular among filtered books
  const popular = await prisma.reading.groupBy({
    by: ["bookId"],
    _count: { bookId: true },
    orderBy: { _count: { bookId: "desc" } },
    take: limit,
  });
  const ids = popular.map((p) => p.bookId);
  const books = await prisma.book.findMany({ where: { id: { in: ids }, ...whereBook } });

  return NextResponse.json(books);
}

