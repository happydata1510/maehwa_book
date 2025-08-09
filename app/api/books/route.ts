import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

// GET /api/books?query=...&age=5
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query")?.trim() ?? "";
  const age = searchParams.get("age");

  const where: any = {};
  if (query) {
    where.OR = [
      { title: { contains: query } },
      { author: { contains: query } },
    ];
  }
  if (age) {
    const n = Number(age);
    if (!Number.isNaN(n)) {
      where.AND = [
        { OR: [{ ageMin: null }, { ageMin: { lte: n } }] },
        { OR: [{ ageMax: null }, { ageMax: { gte: n } }] },
      ];
    }
  }

  try {
    const books = await prisma.book.findMany({
      where,
      orderBy: { title: "asc" },
      take: 20,
    });
    return NextResponse.json(books);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

// POST /api/books
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, author, ageMin, ageMax } = body ?? {};
  if (!title || !author) return NextResponse.json({ error: "title, author required" }, { status: 400 });

  const book = await prisma.book.upsert({
    where: { title_author: { title, author } },
    update: { ageMin: ageMin ?? null, ageMax: ageMax ?? null },
    create: { title, author, ageMin: ageMin ?? null, ageMax: ageMax ?? null },
  });
  return NextResponse.json(book, { status: 201 });
}

