import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";

// GET /api/readers -> list readers
export async function GET() {
  try {
    const readers = await prisma.reader.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json(readers);
  } catch (e) {
    console.error("/api/readers GET error", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

// POST /api/readers -> upsert reader { name, className?, parentPhone? }
export async function POST(req: NextRequest) {
  try {
    // Demo 보호: Vercel+SQLite 환경에서는 쓰기 제한 가능
    if (process.env.VERCEL && (process.env.DATABASE_URL ?? "").startsWith("file:")) {
      return NextResponse.json({ error: "데모 환경에서는 등록이 제한됩니다. 로컬 실행 또는 외부 DB를 설정하세요." }, { status: 503 });
    }
    const body = await req.json();
    const { name, className, parentPhone, age } = body ?? {};
    if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
    const reader = await prisma.reader.upsert({
      where: { name },
      update: { className: className ?? null, parentPhone: parentPhone ?? null, age: age ?? null },
      create: { name, className: className ?? null, parentPhone: parentPhone ?? null, age: age ?? null },
    });
    return NextResponse.json({ ok: true, reader, message: "등록되었습니다." }, { status: 201 });
  } catch (e) {
    console.error("/api/readers POST error", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

