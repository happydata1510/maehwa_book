import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

// GET /api/readers -> list readers
export async function GET() {
  const readers = await prisma.reader.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(readers);
}

// POST /api/readers -> upsert reader { name, className?, parentPhone? }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, className, parentPhone, age } = body ?? {};
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
  const reader = await prisma.reader.upsert({
    where: { name },
    update: { className: className ?? null, parentPhone: parentPhone ?? null, age: age ?? null },
    create: { name, className: className ?? null, parentPhone: parentPhone ?? null, age: age ?? null },
  });
  return NextResponse.json({ ok: true, reader, message: "등록되었습니다." }, { status: 201 });
}

