import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";

// GET /api/export?readerName= (optional) -> CSV
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const readerName = searchParams.get("readerName") ?? undefined;
  const where: any = {};
  if (readerName) where.reader = { name: readerName };
  // TODO: Supabase 쿼리로 수정 필요
  const { data: rows } = await supabase.from('readings').select(`
    *,
    book:books(*),
    reader:readers(*)
  `) || { data: [] };
  
  /*const rows = await prisma.reading.findMany({
    where,
    orderBy: { readDate: "desc" },
    include: { book: true, reader: true },
  });*/
  const header = ["readDate", "title", "author", "readerName"].join(",");
  const body = (rows || [])
    .map((r) => [
      new Date(r.readDate).toISOString().slice(0, 10),
      JSON.stringify(r.book.title),
      JSON.stringify(r.book.author),
      JSON.stringify(r.reader?.name ?? ""),
    ].join(","))
    .join("\n");
  const csv = `${header}\n${body}`;
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="readings.csv"`,
    },
  });
}

